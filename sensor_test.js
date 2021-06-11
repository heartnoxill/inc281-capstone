const button_push = [];
var temp;
var humid;
var light;
var temp_pwm;
var humid_pwm;
var light_pwm;

// Grid Initiate
function newGrid(r, c){
    grids = new Grids({
        rows: r,
        cols: c
    });
    grids.hideBorders();
}

// Grid Size
function gridChild(){
    newGrid(2, 4);
    grids.addChildTo(0, 0, plotTemp);
    grids.addChildTo(0, 1, plotHumid);
    grids.addChildTo(0, 2, plotLight);
    grids.addChildTo(0, 3, plotPh);
    grids.addChildTo(1, 0, gaugeTemp);
    grids.addChildTo(1, 1, gaugeHumid);
    grids.addChildTo(1, 2, gaugeLamp);
}

function psw(){
    const labels = ["Water Pump", "Air Pump", "Bird Detect", "Water Level Danger"];
    const colors = ["green", "yellow", "blue", "red"];

    const leds = [];

    labels.map( (txt, idx) => {

        const led = new Led({
            label: txt,
            type: colors[idx],
            uid: 3-idx
        });

        leds.push(led);
    });

    const linkLED = new WSLink({
        pswCallback: (uid, status, state, error) => {
            leds[3-uid].setStatus(status);
        }
    });
}

// Temperature Graph
function plot_temp(){
    plotTemp = new Plotter({
        mix: 0,
        max: 100,
        step: 4
    });
    plotTemp.clear();
}

// Humidity Graph
function plot_humid(){
    plotHumid = new Plotter({
        mix: 0,
        max: 100,
        step: 4
    });
    plotHumid.clear();
}

// Light Intensity Graph
function plot_light(){
    plotLight = new Plotter({
        mix: 0,
        max: 100,
        step: 4
    });
    plotLight.clear();
}

// pH in scientific soil Graph
function plot_ph(){
    plotPh = new Plotter({
        mix: 0,
        max: 14,
        step: 4
    });
    plotPh.clear();
}

function temp_fan(){
    gaugeTemp = new Gauge({
        min: 0,
        max: 100,
        ticksMajor: 20,
        ticksMinor: 4
    });
}

function humid_fan(){
    gaugeHumid = new Gauge({
        min: 0,
        max: 100,
        ticksMajor: 20,
        ticksMinor: 4
    });
}

function grow_lamp(){
    gaugeLamp = new Gauge({
        min: 0,
        max: 100,
        ticksMajor: 20,
        ticksMinor: 4
    });
}


function temp_threshold(linkPWM){ // 25C is roughly 250
    if(temp>=250 && temp<300){
        linkPWM.pwmDutyRatio(3, 0.33);
        temp_pwm = 0.33;
    }
    else if(temp>=300 && temp<350){
        linkPWM.pwmDutyRatio(3, 0.50);
        temp_pwm = 0.50;
    }
    else if(temp>=350 && temp<400){
        linkPWM.pwmDutyRatio(3, 0.60);
        temp_pwm = 0.60;
    }
    else if(temp>=400 && temp<450){
        linkPWM.pwmDutyRatio(3, 0.70);
        temp_pwm = 0.70;
    }
    else if(temp>=450 && temp<500){
        linkPWM.pwmDutyRatio(3, 0.80);
        temp_pwm = 0.80;
    }
    else if(temp>=500){
        linkPWM.pwmDutyRatio(3, 0.99);
        temp_pwm = 0.99;
    }
    else if(temp<250){
        linkPWM.pwmDutyRatio(3, 0.1); // good temp, need air circulations
        temp_pwm = 0.1;
    }
}

function humid_threshold(linkPWM){ //725 = 70% humidity
    if(humid >= 725){
        linkPWM.pwmDutyRatio(2, 0.1);
        humid_pwm = 0.1;
    }
    else if(humid<725 && humid >= 700){
        linkPWM.pwmDutyRatio(2, 0.6);
        humid_pwm = 0.6;
    }
    else if(humid<700 && humid >= 650){
        linkPWM.pwmDutyRatio(2, 0.7);
        humid_pwm = 0.7;
    }
    else if(humid<650 && humid >= 600){
        linkPWM.pwmDutyRatio(2, 0.8);
        humid_pwm = 0.8;
    }
    else if(humid<600 && humid >= 550){
        linkPWM.pwmDutyRatio(2, 0.9);
        humid_pwm = 0.9;
    }
    else if(humid<550){
        linkPWM.pwmDutyRatio(2, 0.99);
        humid_pwm = 0.99;
    }
}

function lamp_threshold(linkPWM){ // < 10k lux, light on FULL
    if(light<1023){
        linkPWM.pwmDutyRatio(1, 0.99);
        light_pwm = 0.99;
    }
}

function thresh_time(linkPWM){
    linkPWM.pwmFrequency(0, 5);
    linkPWM.pwmDutyRatio(0, 0);
    linkPWM.pwmDutyRatio(1, 0);
    linkPWM.pwmDutyRatio(2, 0);
    linkPWM.pwmDutyRatio(3, 0);

    setInterval(()=>{
        lamp_threshold(linkPWM);
    },3000);

    setInterval(()=>{
        temp_threshold(linkPWM);
    },3000);

    setInterval(()=>{
        humid_threshold(linkPWM);
    },3000);
}

function main(){
    const link = new WSLink();
    const linkPWM = new WSLink({
        conCallback: () => {
            thresh_time(linkPWM);
        }
    });

    psw();

    // Graph plot
    plot_temp(link);
    plot_humid(link);
    plot_light(link);
    plot_ph(link);

    // Gauge plot
    temp_fan(link);
    humid_fan(link);
    grow_lamp(link);

    // setTimeout and *setInterval* are the only native functions of the JavaScript to execute code asynchronously.
    // Temperature
    setInterval(()=>{
        link.adcGet(3, (id, val, err)=>{
            if(err==null){
                temp = val;
                plotTemp.addPoint(val*100/1023);
                // gaugeTemp.setValue([val*100/1023]);
                gaugeTemp.setValue([temp_pwm*100]);
                }
        });   
    }, 3500);

    // Humidity
    setInterval(()=>{
        link.adcGet(2, (id, val, err)=>{
            if(err==null){
                humid = val;
                plotHumid.addPoint(val*100/1023);
                // gaugeHumid.setValue([val*100/1023]);
                gaugeHumid.setValue([humid_pwm*100]);
                }
        });
    }, 3500);

    // Light Intensity
    setInterval(()=>{
        link.adcGet(1, (id, val, err)=>{
            if(err==null && val==val){
                light = val;
                plotLight.addPoint(val*100/1023);
                // gaugeLamp.setValue([val*100/1023]);
                gaugeLamp.setValue([light_pwm*100]);
                }
        });
    }, 3500);

    // pH (range 0 - 14)
    setInterval(()=>{
        link.adcGet(0, (id, val, err)=>{
            if(err==null){
                // plotPh.addPoint(val*100/1023);
                plotPh.addPoint(val*14/1023); // set pH from 0 to 14
                }
        });
    }, 4000);
    
    gridChild();
}
