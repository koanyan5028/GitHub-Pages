"use strict";

class Input{
	constructor(id,name,controls){
		this.id=id;
		this.name=name;
		this.value=preset[id];
		this.controls=controls;
	}

	Init(){
		this.SetValue();
	}

	AddCallback(control,type,callback){
		this.controls[control].addEventListener(type,callback.bind(this));
	}

	SetValue(){
		
	}
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
		console.log("changed");
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
		if(this.log && value===undefined){
			this.controls.slider.value=this.SolveSliderBasePos();
		}
	}

	SolveSliderBasePos(){
		if(this.value<this.min*this.rate) return Math.log(this.value/this.min)/Math.log(this.rate)-1;
		if(this.value>this.max/this.rate) return 1-Math.log(this.max/this.value)/Math.log(this.rate);
		return 0;
	}
};

class InputBool extends Input{
	constructor(id,name){
		let controls={
			text: document.getElementById(name+"_text"),
			slider: document.getElementById(name+"_slider")
		}
		super(id,name,controls);
	}
};

class InputNumber extends Input{
	//id: プリセット内のID
	//name: 要素のID
	//min: 最小値
	//max: 最大値
	constructor(id,name){
		let controls={
			text: document.getElementById(name+"_text"),
			slider: document.getElementById(name+"_slider")
		}
		super(id,name,controls);
	}
};

class InputOreGeneration extends Input{
	constructor(id,name){
		let controls={
			text: document.getElementById(name+"_text"),
			slider: document.getElementById(name+"_slider")
		}
		super(id,name,controls);
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
	];
}

function InputPreset(){
	let text=presetElement.value;
	if(text.includes("\n")){
		presetElement.value=presetElement.value.replace("\n","");
		presetElement.blur();
		setTimeout(
			()=>{presetElement.scrollTop=0;},
			0
		)
	}
}

function CopyPreset(){
	presetElement.select();
	document.execCommand("copy");
	window.getSelection().removeAllRanges();
}

function SetPreset(){
	presetElement.innerText=JSON.stringify(preset);
}

function OnChangeBiome(){
	let biome=Number(biomeElement.value);
	if(biome==-2){
		biomeLabelElement.hidden=false;
		biomeLabelElement.innerText="※Minecraftのバグによりプリセットでこのバイオームに設定する事が出来ません\n設定する必要がある場合は手動で設定して下さい\n";
		biome=36;
	}else if(biome>=8){
		biomeLabelElement.hidden=false;
		biomeLabelElement.innerText="※Minecraftのバグによりこのバイオームを設定するとカスタマイズ画面を開き直した時に設定されたバイオームが2つ後ろにずれるので注意して下さい\n"
	}else{
		biomeLabelElement.hidden=true;
	}
	preset.fixedBiome=biome;
	SetPreset();
}

let presetElement=document.getElementById("preset");
let biomeElement=document.getElementById("biome");
let biomeLabelElement=document.getElementById("biome_label");
let preset;
let controls;

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