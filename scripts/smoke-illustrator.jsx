// SPDX-License-Identifier: GPL-3.0-only
/* Run manually in Illustrator: File > Scripts > Other Script.
   Creates and closes only its own disposable document; never saves it. */
(function () {
    var source = new File(File($.fileName).parent.parent.fsName + '/host/illustrator.jsx');
    $.evalFile(source);
    var original = app.documents.length ? app.activeDocument : null, doc = null, output;
    function check(value, message) { if (!value) throw new Error(message); }
    function call(method, payload) {
        // Test-only: parses this project's trusted serializer output in ES3.
        var result = eval('(' + GridloomHost.dispatch(method, payload) + ')');
        check(result.ok, result.error); return result.value;
    }
    try {
        doc = app.documents.add(DocumentColorSpace.RGB, 420 * 72 / 25.4, 594 * 72 / 25.4);
        var context = call('context', {scope:'artboard'}), bounds = context.contexts[0].bounds;
        var lines = [[bounds[0]+24,bounds[1],bounds[0]+24,bounds[3]], [bounds[0]+48,bounds[1],bounds[0]+48,bounds[3]]];
        var result = call('apply', {token:context.token,plans:[{key:context.contexts[0].key,lines:lines}],mode:'replace'});
        check(result.count===2 && doc.pathItems.length===2, 'Initial generation failed');
        check(doc.pathItems[0].guides===true && doc.pathItems[1].guides===true, 'Native guide conversion failed');
        check(!doc.pathItems[0].name && !doc.pathItems[1].name, 'Default guide labels overwritten');
        context = call('context', {scope:'artboard'});
        result = call('apply', {token:context.token,plans:[{key:context.contexts[0].key,lines:lines}],mode:'replace'});
        check(result.count===2 && result.removed===2 && doc.pathItems.length===2, 'Replacement failed');
        var manual=doc.activeLayer.pathItems.add();manual.setEntirePath([[bounds[0]+72,bounds[1]],[bounds[0]+72,bounds[3]]]);manual.guides=true;
        context=call('context',{scope:'artboard'});result=call('clear',{token:context.token,clearMode:'owned'});
        check(result.removed===2 && doc.pathItems.length===1 && !doc.pathItems[0].note, 'Owned-only clear failed');
        var shape=doc.activeLayer.pathItems.rectangle(bounds[1]-20,bounds[0]+20,200,150);doc.selection=null;shape.selected=true;
        context=call('context',{scope:'selection'});
        check(context.contexts[0].bounds[2]-context.contexts[0].bounds[0]===200, 'Selection bounds failed');
        output='PASS: Illustrator '+app.version+'; create, replace, owned clear, manual-guide preservation, selection bounds. Disposable document closed without saving.';
    } catch(error) { output='FAIL: '+error.message; }
    finally { if(doc)doc.close(SaveOptions.DONOTSAVECHANGES);if(original)try{original.activate();}catch(ignore){} }
    return output;
})();
