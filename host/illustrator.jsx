// SPDX-License-Identifier: GPL-3.0-only
/* ExtendScript / ES3 only. No filesystem or arbitrary-script RPC. */
var GridloomHost = (function () {
    var pending = null, serial = 0, prefix = 'gridloom:1|';
    function encode(value) {
        var type = typeof value, out = [], i, key;
        if (value === null || type === 'undefined') return 'null';
        if (type === 'string') return '"' + value.replace(/["\\\x00-\x1f\u2028\u2029]/g, function (c) {
            var hex = c.charCodeAt(0).toString(16); return '\\u' + ('0000' + hex).slice(-4);
        }) + '"';
        if (type === 'number') return isFinite(value) ? String(value) : 'null';
        if (type === 'boolean') return String(value);
        if (value instanceof Array) { for (i = 0; i < value.length; i++) out.push(encode(value[i])); return '[' + out.join(',') + ']'; }
        for (key in value) if (value.hasOwnProperty(key)) out.push(encode(key) + ':' + encode(value[key]));
        return '{' + out.join(',') + '}';
    }
    function check(value, message) { if (!value) throw new Error(message); }
    function document() { check(app.documents.length > 0, '请先打开 Illustrator 文档'); return app.activeDocument; }
    function rect(value) { return [Number(value[0]), Number(value[1]), Number(value[2]), Number(value[3])]; }
    function union(a, b) { return a ? [Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2]),Math.min(a[3],b[3])] : b; }
    function itemBounds(item, visible) {
        var result = null, i, child;
        if (item.typename === 'GroupItem') {
            if (item.clipped) {
                for (i=0;i<item.pageItems.length;i++) {
                    child=item.pageItems[i];
                    if (child.typename==='PathItem' && child.clipping) return rect(child.geometricBounds);
                    if (child.typename==='CompoundPathItem' && child.pathItems.length && child.pathItems[0].clipping) return rect(child.geometricBounds);
                }
                throw new Error('无法读取剪切蒙版边界');
            }
            for(i=0;i<item.pageItems.length;i++) result=union(result,itemBounds(item.pageItems[i],visible));
            check(result, '选中组没有可测量对象'); return result;
        }
        check(item.geometricBounds, '请选择对象，而非文字插入点');
        return rect(visible ? item.visibleBounds : item.geometricBounds);
    }
    function contexts(doc, options) {
        var index=doc.artboards.getActiveArtboardIndex(), board=rect(doc.artboards[index].artboardRect), result=[], selected=doc.selection, bounds=null, i;
        var scope=options.scope || 'auto';
        if(scope==='all') {
            for(i=0;i<doc.artboards.length;i++) result.push({key:'artboard:'+i,name:doc.artboards[i].name,bounds:rect(doc.artboards[i].artboardRect),artboard:rect(doc.artboards[i].artboardRect)});
        } else if(scope==='selection' || scope==='auto' && selected && selected.length) {
            check(selected && selected.length, '请先选择对象');
            for(i=0;i<selected.length;i++) bounds=union(bounds,itemBounds(selected[i],options.visibleBounds));
            check(bounds && bounds[2]>bounds[0] && bounds[1]>bounds[3], '选区需要具有宽度和高度');
            result.push({key:'selection:'+bounds.join(','),name:doc.artboards[index].name+' · '+(/zh/i.test(app.locale || '')?'选区':'Selection'),bounds:bounds,artboard:board});
        } else result.push({key:'artboard:'+index,name:doc.artboards[index].name,bounds:board,artboard:board});
        return result;
    }
    function rulerUnit(doc) {
        var name=String(doc.rulerUnits).replace('RulerUnits.','');
        var units={Pixels:'px',Points:'pt',Millimeters:'mm',Centimeters:'cm',Inches:'in',Picas:'pc',Meters:'m',Feet:'ft',FeetInches:'ft',Yards:'yd'};
        return units[name] || 'pt';
    }
    function read(options) {
        var doc=document(), list=contexts(doc,options), token=String(new Date().getTime())+'-'+(++serial);
        pending={doc:doc,options:options,list:list,token:token,unit:rulerUnit(doc)};
        return {token:token,name:doc.name,contexts:list,unit:pending.unit,guideState:guideState(doc)};
    }
    function verified(token) {
        check(pending && pending.token===token, '操作已过期，请重新生成');
        check(document()===pending.doc, '当前文档已切换，请重新生成');
        check(rulerUnit(pending.doc)===pending.unit, '文档单位已变化，请重新生成');
        check(encode(contexts(pending.doc,pending.options))===encode(pending.list), '选区或画板已变化，请重新生成');
        return pending;
    }
    function owned(path) { return path.note && path.note.indexOf(prefix)===0; }
    function intersects(bounds, area) { return bounds[0]<=area[2]+0.001 && bounds[2]>=area[0]-0.001 && bounds[1]>=area[3]-0.001 && bounds[3]<=area[1]+0.001; }
    function guideLayer(doc) {
        for(var i=0,n=doc.layers.length;i<n;i++) {
            var layer=doc.layers[i];
            if(layer.name==='gridloom'||layer.name==='Gridloom')return layer;
        }
        return null;
    }
    function guideState(doc) {
        var layer=guideLayer(doc);
        return {exists:!!layer,locked:layer?layer.locked:false,visible:layer?layer.visible:true};
    }
    function toggleLayer(property) {
        var doc=document(),layer=guideLayer(doc);
        check(layer,'请先生成 gridloom 参考线');
        layer[property]=!layer[property];
        return guideState(doc);
    }
    function layerFor(doc) {
        var layer=guideLayer(doc);
        if(layer) {check(!layer.locked && layer.visible, '请先解锁并显示 gridloom 图层');return {layer:layer,created:false};}
        layer=doc.layers.add();layer.name='gridloom';return {layer:layer,created:true};
    }
    function pathData(path) {
        var points=[],i,p;
        for(i=0;i<path.pathPoints.length;i++){p=path.pathPoints[i];points.push({anchor:rectPoint(p.anchor),left:rectPoint(p.leftDirection),right:rectPoint(p.rightDirection),type:p.pointType});}
        return {parent:path.parent||path.layer,points:points,closed:path.closed,note:path.note,name:path.name,hidden:path.hidden,locked:path.locked};
    }
    function rectPoint(p){ return [Number(p[0]),Number(p[1])]; }
    function restore(data) {
        var path=data.parent.pathItems.add(),i,p;path.closed=data.closed;
        for(i=0;i<data.points.length;i++){p=path.pathPoints.add();p.anchor=data.points[i].anchor;p.leftDirection=data.points[i].left;p.rightDirection=data.points[i].right;p.pointType=data.points[i].type;}
        path.guides=true;check(path.guides===true, '无法创建原生参考线');path.note=data.note;path.name=data.name;path.hidden=data.hidden;path.locked=data.locked;return path;
    }
    function execute(payload, clearing) {
        var state=verified(payload.token), doc=state.doc, newPaths=[], newGroups=[], oldGroups=[], removed=[], toRemove=[], layerInfo=null, oldLayer=doc.activeLayer;
        var i,j,k,p,batch=String(new Date().getTime())+'-'+serial, plans=payload.plans || [],total=0,keys={},areas=state.list;
        check(clearing || plans.length===areas.length, '网格范围不匹配');
        for(i=0;i<plans.length;i++) {
            check(plans[i].key===areas[i].key, '网格范围不匹配');keys[prefix+plans[i].key+'|']=true;
            check(plans[i].lines instanceof Array, '无效参考线列表');total+=plans[i].lines.length;
            for(j=0;j<plans[i].lines.length;j++) {
                p=plans[i].lines[j];check(p.length===4, '无效参考线');
                for(k=0;k<4;k++)check(typeof p[k]==='number'&&isFinite(p[k])&&Math.abs(p[k])<1e7, '坐标超出范围');
                check(p[0]===p[2]||p[1]===p[3], '仅支持水平或垂直参考线');
            }
        }
        check(total<=5000, '一次操作最多生成 5000 条参考线');
        if(!clearing && total===0) return {count:0,removed:0};
        // Appending never needs to inspect existing artwork. Cache the native collection size.
        var pathCount, paths=(clearing || payload.mode==='replace')?doc.pathItems:null;
        for(i=0, pathCount=paths?paths.length:0;i<pathCount;i++) {
            p=paths[i];if(!p.guides)continue;
            var matches=false;
            if(clearing) {
                if(!owned(p) && payload.clearMode!=='all')continue;
                for(j=0;j<areas.length;j++) if(intersects(rect(p.geometricBounds),areas[j].bounds)){matches=true;break;}
            } else if(payload.mode==='replace' && owned(p)) {
                for(k in keys) if(keys.hasOwnProperty(k)&&p.note.indexOf(k)===0){matches=true;break;}
            }
            if(matches){check(!p.locked && p.editable, '范围内有锁定参考线，请先解锁');toRemove.push(p);var parent=p.parent;if(parent&&parent.typename==='GroupItem'&&parent.note&&parent.note.indexOf('gridloom:group|')===0){var seen=false;for(j=0;j<oldGroups.length;j++)if(oldGroups[j]===parent)seen=true;if(!seen)oldGroups.push(parent);}}
        }
        check(toRemove.length<=5000, '一次操作最多清除 5000 条参考线');
        try {
            if(total)layerInfo=layerFor(doc);
            for(i=0;i<plans.length;i++) {
                if(!plans[i].lines.length)continue;
                var group=layerInfo.layer.groupItems.add();newGroups.push(group);
                group.name=areas[i].name;
                group.note='gridloom:group|'+plans[i].key+'|'+batch;
                for(j=0;j<plans[i].lines.length;j++){
                    var line=plans[i].lines[j];p=group.pathItems.add();newPaths.push(p);
                    p.setEntirePath([[line[0],line[1]],[line[2],line[3]]]);p.filled=false;p.stroked=false;p.guides=true;
                    p.note=prefix+plans[i].key+'|'+batch;
                    check(p.guides===true, '无法创建原生参考线');
                }
            }
            for(i=0;i<toRemove.length;i++){var data=pathData(toRemove[i]);toRemove[i].remove();removed.push(data);}
            if(layerInfo)layerInfo.layer.name='gridloom';
            pending=null;app.redraw();
            for(i=0;i<oldGroups.length;i++)try{if(!oldGroups[i].pageItems.length)oldGroups[i].remove();}catch(ignoreEmpty){}
            return {count:newPaths.length,removed:removed.length,guideState:guideState(doc)};
        } catch(error) {
            var failures=0;
            for(i=newPaths.length-1;i>=0;i--)try{newPaths[i].remove();}catch(ignore){failures++;}
            for(i=0;i<removed.length;i++)try{restore(removed[i]);}catch(ignore2){failures++;}
            for(i=newGroups.length-1;i>=0;i--)try{if(!newGroups[i].pageItems.length)newGroups[i].remove();}catch(ignoreGroup){failures++;}
            if(layerInfo&&layerInfo.created)try{if(!layerInfo.layer.pageItems.length)layerInfo.layer.remove();}catch(ignore3){}
            if(failures)throw new Error(error.message+'；恢复未完成，请检查文档或使用撤销');
            throw error;
        } finally {try{doc.activeLayer=oldLayer;}catch(ignore4){}}
    }
    return {dispatch:function(method,payload){
        try {
            var result;
            if(method==='context')result=read(payload || {});
            else if(method==='apply')result=execute(payload,false);
            else if(method==='clear')result=execute(payload,true);
            else if(method==='lockGuides')result=toggleLayer('locked');
            else if(method==='visibility')result=toggleLayer('visible');
            else throw new Error('未知操作');
            return encode({ok:true,value:result});
        } catch(error){return encode({ok:false,error:String(error.message || error)});}
    }};
})();
