"use strict";

class Input{
	constructor(id,name,controls){
		this.id=id;
		this.name=name;
		this.value=preset[id];
		this.controls=controls;
		Input.controls.push(this);
	}

	Init(){
		this.SetValue();
	}

	AddCallback(control,type,callback){
		this.controls[control].addEventListener(type,callback.bind(this));
	}

	SetValue(){
		
	}

	static PresetChanged(){
		for(let control of this.controls){
			let id=control.id;
			control.value=preset[id];
			control.SetValue();
		}
	}

	static controls=[];
};

class InputInt extends Input{
	//id: プリセット内のID
	//name: 要素のID
	//min: 最小値
	//max: 最大値
	constructor(id,name,min,max,log=false,rate=2){
		let controls={
			text: document.getElementById(name+"_text"),
			slider: document.getElementById(name+"_slider")
		}
		super(id,name,controls);
		this.min=min;
		this.max=max;
		this.log=log;
		this.rate=rate;

		this.Init();
		this.AddCallback("text","input",this.OnTextInput);
		this.AddCallback("slider","input",this.OnSliderInput);
		this.AddCallback("slider","change",this.OnSliderChanged);
	}

	OnTextInput(){
		let value=Number(this.controls.text.value);
		if(value<this.min) value=this.min;
		if(value>this.max) value=this.max;
		this.value=value;
		this.SetValue();
		preset[this.id]=value;
		SetPreset();
	}

	OnSliderInput(){
		let value=Number(this.controls.slider.value);
		if(this.log){
			let base=this.SolveSliderBasePos();
			value=Math.floor(this.rate**(value-base)*this.value);
			if(value==0) value=1;
			if(value<this.min) value=this.min;
			if(value>this.max) value=this.max;
		}
		this.controls.text.value=value;
		this.SetValue(value);
		preset[this.id]=value;
		SetPreset();
	}

	OnSliderChanged(){
		let value=Number(this.controls.slider.value);
		if(this.log){
			let base=this.SolveSliderBasePos();
			value=Math.floor(this.rate**(value-base)*this.value);
			if(value==0) value=1;
			if(value<this.min) value=this.min;
			if(value>this.max) value=this.max;
		}
		this.controls.text.value=value;
		this.value=value;
		this.SetValue();
		preset[this.id]=value;
		SetPreset();
	}

	//スライダーを変更し終わった場合など(value===undefinedの場合)は
	//  this.valueの値を参照する(スライダーの位置も設定する)
	//
	//スライダーを変更し終えていない場合(value!==undefined)は
	//  valueの値をテキストボックスに設定する
	SetValue(value){
		this.controls.text.value=value??this.value;
		if(value===undefined){
			if(this.log){
				this.controls.slider.value=this.SolveSliderBasePos();
			}else{
				this.controls.slider.value=this.value;
			}
		}
	}

	SolveSliderBasePos(){
		if(this.value<this.min*this.rate) return Math.log(this.value/this.min)/Math.log(this.rate)-1;
		if(this.value>this.max/this.rate) return 1-Math.log(this.max/this.value)/Math.log(this.rate);
		return 0;
	}
};

class InputBool extends Input{
	constructor(id,name,value){
		let controls={
			button: document.getElementById(name+"_button")
		}
		super(id,name,controls);
		this.value=value;

		this.Init();
		this.AddCallback("button","click",this.OnClick);
	}

	OnClick(){
		this.value=!this.value;
		this.SetValue();
		preset[this.id]=this.value;
		SetPreset();
	}

	SetValue(){
		this.controls.button.value=this.value?"はい":"いいえ";
	}
};

class InputNumber extends Input{
	//id: プリセット内のID
	//name: 要素のID
	//min: 最小値
	//max: 最大値
	//preText: 変更前のテキスト
	constructor(id,name,offset=50){
		let controls={
			text: document.getElementById(name+"_text"),
			slider: document.getElementById(name+"_slider")
		}
		super(id,name,controls);
		this.offset=offset;
		this.preText=this.controls.text.value;

		this.Init();
		this.AddCallback("text","input",this.OnTextInput);
		this.AddCallback("slider","input",this.OnSliderInput);
		this.AddCallback("slider","change",this.OnSliderChanged);
	}

	OnTextInput(){
		let text=this.controls.text.value;
		let valid=true;
		let point=false;
		let exponent=false;
		for(let i=0;i<text.length;i++){
			//通常の数字はパス
			if("0123456789".includes(text[i])) continue;

			//先頭以外、eより前の小数点はパス
			if(i>=1 && text[i]=="." && (!point) && (!exponent)){
				point=true;
				continue;
			}

			//先頭またはeの直後の符号はパス
			if((i==0 || "eE".includes(text[i-1])) && "+-".includes(text[i])) continue;

			//先頭以外、小数点の直後でないeはパス
			if(i>=1 && "eE".includes(text[i])){
				if(!exponent){
					exponent=true;
					continue;
				}
			}

			//それ以外はパスしない
			valid=false;
			break;
		}

		//パスしなかった文字列の変更は元に戻す
		if(!valid){
			this.controls.text.value=this.preText;
			return;
		}

		//入力途中のテキストはいじらない
		if(text=="" || ".+-eE".includes(text[text.length-1]) || text.includes(".e") || text.includes(".E")){
			this.preText=text;
			return;
		}

		let value=Number(text);
		console.log(`text: "${text}", value: ${value}`);
		this.value=value;
		this.SetValue(value,false,true);
		preset[this.id]=value;
		SetPreset();
		this.preText=text;
	}

	OnSliderInput(){
		let value=Number(this.controls.slider.value);
		let scale=this.SolveScale();
		value=this.value+value*scale;
		this.controls.text.value=value;
		this.SetValue(value,true,false);
		preset[this.id]=value;
		SetPreset(value);
	}

	OnSliderChanged(){
		let value=Number(this.controls.slider.value);
		let scale=this.SolveScale();
		value=this.value+value*scale;
		this.controls.text.value=value;
		this.value=value;
		this.SetValue(value,true,true);
		preset[this.id]=value;
		SetPreset(value);
	}

	SetValue(value,setText=true,resetSlider=true){
		if(value===undefined) value=this.value;
		if(setText){
			let valueText=value.toString();
			if(Math.abs(value)>=1e7){
				valueText=value.toExponential(7);
			}else{
				valueText=valueText.substring(0,9+(valueText<0?1:0));
				if(valueText[-1]=="."){
					valueText=valueText.substring(0,valueText.length-1);
				}
			}
			this.controls.text.value=valueText;
			this.preText=valueText;
		}
		if(resetSlider){
				this.controls.slider.value=0;
		}
	}

	SolveScale(){
		const scale=1;
		const offset=this.offset;
		return Math.sqrt(offset*offset+scale*scale*this.value*this.value);
	}
};


function Init(){
	biomeLabelElement.hidden=true;

	preset=JSON.parse(JSON.stringify(defaultPreset));
	SetPreset();

	controls=[
		new InputInt("seaLevel","sea_level",1,255),
		new InputInt("dungeonChance","dungeon_chance",1,10000,true,10),
		new InputInt("waterLakeChance","water_lake_chance",1,100),
		new InputInt("lavaLakeChance","lava_lake_chance",1,100),
		new InputInt("biomeSize","biome_size",0,31),
		new InputInt("riverSize","river_size",0,31),
		new InputBool("useLavaOceans","use_lava_oceans",false),
		new InputBool("useCaves","use_caves",true),
		new InputBool("useStrongholds","use_strongholds",true),
		new InputBool("useVillages","use_villages",true),
		new InputBool("useMineShafts","use_mine_shafts",true),
		new InputBool("useTemples","use_temples",true),
		new InputBool("useMonuments","use_monuments",true),
		new InputBool("useMansions","use_mansions",true),
		new InputBool("useRavines","use_ravines",true),
		new InputBool("useDungeons","use_dungeons",true),
		new InputBool("useWaterLakes","use_water_lakes",true),
		new InputBool("useLavaLakes","use_lava_lakes",true),
		new InputNumber("mainNoiseScaleX","main_noise_scale_x"),
		new InputNumber("mainNoiseScaleY","main_noise_scale_y"),
		new InputNumber("mainNoiseScaleZ","main_noise_scale_z"),
		new InputNumber("depthNoiseScaleX","depth_noise_scale_x"),
		new InputNumber("depthNoiseScaleZ","depth_noise_scale_z"),
		new InputNumber("depthNoiseScaleExponent","depth_noise_scale_exponent"),
		new InputNumber("baseSize","base_size"),
		new InputNumber("coordinateScale","coordinate_scale"),
		new InputNumber("heightScale","height_scale"),
		new InputNumber("stretchY","stretch_y"),
		new InputNumber("upperLimitScale","upper_limit_scale"),
		new InputNumber("lowerLimitScale","lower_limit_scale"),
		new InputNumber("biomeDepthWeight","biome_depth_weight",10),
		new InputNumber("biomeDepthOffset","biome_depth_offset",10),
		new InputNumber("biomeScaleWeight","biome_scale_weight",10),
		new InputNumber("biomeScaleOffset","biome_scale_offset",10),
	];

	oreControls={
		"size": new InputInt(selectedOre+"Size","ore_size",0,100),
		"count": new InputInt(selectedOre+"Count","ore_count",0,100),
		"minHeight": new InputInt(selectedOre+"MinHeight","ore_min_height",0,256),
		"maxHeight": new InputInt(selectedOre+"MaxHeight","ore_max_height",0,256)
	}
}

function InputPreset(){
	let text=presetElement.value;
	if(text.includes("\n")){
		presetElement.value=presetElement.value.replace("\n","");
		presetElement.blur();
		setTimeout(
			()=>{presetElement.scrollTop=0;},
			0
		);
	}
}

function ChangePreset(){
	try{
		preset={...defaultPreset,...JSON.parse(presetElement.value)};
		presetWarningLabelElement.innerText="";
	}catch{
		presetWarningLabelElement.innerText="プリセットが無効です";
		SetPreset();
		setTimeout(()=>{
			presetWarningLabelElement.innerText="";
		},2000);
		return;
	}
	let keys=Object.keys(preset);
	let defaultKeys=Object.keys(defaultPreset);
	for(let key of keys){
		if(!defaultKeys.includes(key)){
			delete preset[key];
		}
	}
	let biome=preset.fixedBiome;
	if(biome>=36){
		biome-=28;
	}else if(biome>=8){
		biome+=2;
	}
	biomeElement.value=biome;
	OnChangeBiome();
	SetPreset();
	Input.PresetChanged();
}

function CopyPreset(){
	presetElement.select();
	document.execCommand("copy");
	window.getSelection().removeAllRanges();
	presetInfoLabelElement.innerText="コピーしました";
	setTimeout(()=>{
		presetInfoLabelElement.innerText="";
	},2000);
}

function SetPreset(){
	presetElement.value=JSON.stringify(preset);
}

function OnChangeBiome(){
	let biome=Number(biomeElement.value);
	if(biome==8 || biome==9){
		biomeLabelElement.hidden=false;
		biomeLabelElement.innerText="※Minecraftのバグによりプリセットでこのバイオームに設定する事が出来ません\n設定する必要がある場合は手動で設定して下さい\n";
		biome+=28;
	}else if(biome>=10){
		biomeLabelElement.hidden=false;
		biomeLabelElement.innerText="※Minecraftのバグによりこのバイオームを設定するとカスタマイズ画面を開き直した時に設定されたバイオームが2つ後ろにずれるので注意して下さい\n";
		biome-=2;
	}else{
		biomeLabelElement.hidden=true;
	}
	preset["fixedBiome"]=biome;
	SetPreset();
}

function OnChangeOre(){
	selectedOre=oreElement.value;

	oreControls.size.id=selectedOre+"Size";
	oreControls.size.value=preset[selectedOre+"Size"];
	oreControls.size.Init();
	oreControls.count.id=selectedOre+"Count";
	oreControls.count.value=preset[selectedOre+"Count"];
	oreControls.count.Init();

	if(selectedOre=="lapis"){
		oreControls.minHeight.id=selectedOre+"CenterHeight";
		oreControls.minHeight.value=preset[selectedOre+"CenterHeight"];
		oreControls.minHeight.Init();
		oreControls.maxHeight.id=selectedOre+"Spread";
		oreControls.maxHeight.value=preset[selectedOre+"Spread"];
		oreControls.maxHeight.Init();
		oreMinHeightLabelElement.innerText="中心高度:";
		oreMaxHeightLabelElement.innerText="分散高度:";
	}else{
		oreControls.minHeight.id=selectedOre+"MinHeight";
		oreControls.minHeight.value=preset[selectedOre+"MinHeight"];
		oreControls.minHeight.Init();
		oreControls.maxHeight.id=selectedOre+"MaxHeight";
		oreControls.maxHeight.value=preset[selectedOre+"MaxHeight"];
		oreControls.maxHeight.Init();
		oreMinHeightLabelElement.innerText="高度下限:";
		oreMaxHeightLabelElement.innerText="高度上限:";
	}
}

let presetElement=document.getElementById("preset");
let presetWarningLabelElement=document.getElementById("preset_warning_label");
let presetInfoLabelElement=document.getElementById("preset_info_label");
let biomeElement=document.getElementById("biome");
let biomeLabelElement=document.getElementById("biome_label");
let oreElement=document.getElementById("ore");
let oreMinHeightLabelElement=document.getElementById("ore_min_height_label");
let oreMaxHeightLabelElement=document.getElementById("ore_max_height_label");
let selectedOre="dirt";
let preset;
let controls;
let oreControls;

let defaultPreset={
	"coordinateScale": 684.412,
	"heightScale": 684.412,
	"lowerLimitScale": 512.0,
	"upperLimitScale": 512.0,
	"depthNoiseScaleX": 200.0,
	"depthNoiseScaleZ": 200.0,
	"depthNoiseScaleExponent": 0.5,
	"mainNoiseScaleX": 80.0,
	"mainNoiseScaleY": 160.0,
	"mainNoiseScaleZ": 80.0,
	"baseSize": 8.5,
	"stretchY": 12.0,
	"biomeDepthWeight": 1.0,
	"biomeDepthOffset": 0.0,
	"biomeScaleWeight": 1.0,
	"biomeScaleOffset": 0.0,
	"seaLevel": 63,
	"useCaves": true,
	"useDungeons": true,
	"dungeonChance": 7,
	"useStrongholds": true,
	"useVillages": true,
	"useMineShafts": true,
	"useTemples": true,
	"useMonuments": true,
	"useMansions": true,
	"useRavines": true,
	"useWaterLakes": true,
	"waterLakeChance": 4,
	"useLavaLakes": true,
	"lavaLakeChance": 80,
	"useLavaOceans": false,
	"fixedBiome": -1,
	"biomeSize": 4,
	"riverSize": 4,
	"dirtSize": 33,
	"dirtCount": 10,
	"dirtMinHeight": 0,
	"dirtMaxHeight": 256,
	"gravelSize": 33,
	"gravelCount": 8,
	"gravelMinHeight": 0,
	"gravelMaxHeight": 256,
	"graniteSize": 33,
	"graniteCount": 10,
	"graniteMinHeight": 0,
	"graniteMaxHeight": 80,
	"dioriteSize": 33,
	"dioriteCount": 10,
	"dioriteMinHeight": 0,
	"dioriteMaxHeight": 80,
	"andesiteSize": 33,
	"andesiteCount": 10,
	"andesiteMinHeight": 0,
	"andesiteMaxHeight": 80,
	"coalSize": 17,
	"coalCount": 20,
	"coalMinHeight": 0,
	"coalMaxHeight": 128,
	"ironSize": 9,
	"ironCount": 20,
	"ironMinHeight": 0,
	"ironMaxHeight": 64,
	"goldSize": 9,
	"goldCount": 2,
	"goldMinHeight": 0,
	"goldMaxHeight": 32,
	"redstoneSize": 8,
	"redstoneCount": 8,
	"redstoneMinHeight": 0,
	"redstoneMaxHeight": 16,
	"diamondSize": 8,
	"diamondCount": 1,
	"diamondMinHeight": 0,
	"diamondMaxHeight": 16,
	"lapisSize": 7,
	"lapisCount": 1,
	"lapisCenterHeight": 16,
	"lapisSpread": 16
};

Init();