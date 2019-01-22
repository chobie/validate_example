var path = require('path');
var PSD = require('psd');

// 初期化
var errors = [];
// node validate.js example.psdでやるのでargvは2。適切に変えてね。
var file =  process.argv[2];
var file_path = path.resolve(file);

var layerset_rules = ["hair", "face", "body"];
var per_rules = {
	"hair": [
		"front_hair.png"
	],
	"face": [
		"normal.png",
		"lough.png"
	],
	"body": [
		"body.png",
		"body_b.png"
	]
}

// ファイルの読み込み
console.log("# loading " + file_path)
var psd = PSD.fromFile(file_path);

// psdのparse処理
var data = null;

try {
    psd.parse();
	data = psd.tree().export();
	} catch (e) {
	console.error("[ERROR] parsing file failed: " + file);
	return;
}

///////////////////////
// validation実施
///////////////////////

// 稀に同じレイヤ名が重複していることもあるのでチェックはいれておこう！
var dupcheck = {};
traverse(data.children, function(layer, parent) {
	if (parent == undefined) {
		// 親がない、ということはtoplevelなので
		var failed = true;
		for (var n in layerset_rules) {
			if (layerset_rules[n] == layer.name) {
				failed = false;
				break;
			}
		}
		
		if (failed) {
			console.error("[ERROR] " + layer.name + " doesn't match layerset rule");
			return false;
		}
	} else {
		var failed = true;
		for (var n in per_rules[parent.name]) {
			if (per_rules[parent.name][n] == layer.name) {
				failed = false;
				break;
			}
		}
		if (failed) {
			console.error("[ERROR] " + layer.name + " doesn't match layer name rule");
			return false;
		}
	}
	
	return true;
});


// psdの巡回
function traverse(layers, callback, parent) {
	for (var n in layers) {
		// skip comment layer: #もしくは＃が先頭の場合は処理をスキップ。
		if (layers[n].name.indexOf("#") == 0 || layers[n].name.indexOf("＃") == 0) {
			continue;
		}
		
		// DEBUG用に名前だしておこう。必要なければ削ってね。
		console.log("# " + layers[n].name);
		
		// 直前の親までしかとってないので必要があればよしなに
		if (callback(layers[n], parent) == false) {
			// failed: エラー見つけても続行したい場合はreturnを外そう。
			return;
		}

		if (!dupcheck[layers[n].name]) {
			dupcheck[layers[n].name] = true;
		} else {
			console.error("[ERROR] found duplicate: " + layers[n].name);
		}
		
		if (layers[n].children != undefined) {
			traverse(layers[n].children, callback, layers[n])
		}
	}
}
