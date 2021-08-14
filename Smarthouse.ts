/**
 * Custom blocks
 */
//% weight=98 color=#ffba52 icon="\uf015" block="Smarthouse"
namespace House {
    let light_variable = 0
    let temperature_variable = 0
    let humidity_variable = 0
    let heat_variable = 0
    let button_variable = 0
    let motion_variable = 0
    let flame_variable 
    let towngas_variable = 0

    let temp = 0
    let temp_pin = 0
    let _temperature: number = -999.0
    let _humidity: number = -999.0
    let _readSuccessful: boolean = false

    export enum ServoDirection {
        //% block="clockwise"
        clockwise,
        //% block="anti-clockwise"
        anticlockwise
    }

    export enum DHT11dataType {
        //% block="temperature"
        temperature,
        //% block="humidity"
        humidity
    }

    export enum ServoSpeed {
        //% blockId=servo360_level_0
        //% block="Stop"
        level0 = 0,
        //% blockId=servo360_level_1
        //% block="Level 1"
        level1 = 1,
        //% blockId=servo360_level_2
        //% block="Level 2"
        level2 = 2,
        //% blockId=servo360_level_3
        //% block="Level 3"
        level3 = 3
    }

    export enum DistanceUnit {
        //% block="cm"
        Centimeters,
        //% block="inches"
        Inches,
        //% block="μs"
        MicroSeconds
    }

    //% blockId="smarthon_get_light_house" 
    //% block="Get light value (percentage) at Pin %pin"
    //% weight=65	

    export function getLight(pin: AnalogPin): number {
        light_variable = Math.round(pins.map(
            pins.analogReadPin(pin),
            0,
            1023,
            0,
            100
        ));
        return light_variable;
    }


    //% block="Get DHT11 at Pin %dataPin|"
    function dht11_queryData(dataPin: DigitalPin) {

        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)
        _humidity = -999.0
        _temperature = -999.0
        _readSuccessful = false

        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol
        basic.pause(18)
        //if (pullUp) pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin)
        control.waitMicros(20)
        while (pins.digitalReadPin(dataPin) == 1);
        while (pins.digitalReadPin(dataPin) == 0); //sensor response
        while (pins.digitalReadPin(dataPin) == 1); //sensor response

        //read data (5 bytes)
        for (let index = 0; index < 40; index++) {
            while (pins.digitalReadPin(dataPin) == 1);
            while (pins.digitalReadPin(dataPin) == 0);
            control.waitMicros(28)
            //if sensor pull up data pin for more than 28 us it means 1, otherwise 0
            if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
        }

        endTime = input.runningTimeMicros()

        //convert byte number array to integer
        for (let index = 0; index < 5; index++)
            for (let index2 = 0; index2 < 8; index2++)
                if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)

        //verify checksum
        checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
        checksum = resultArray[4]
        if (checksumTmp >= 512) checksumTmp -= 512
        if (checksumTmp >= 256) checksumTmp -= 256
        if (checksum == checksumTmp) _readSuccessful = true

        //read data if checksum ok
        if (_readSuccessful) {

            //DHT11
            _humidity = resultArray[0] + resultArray[1] / 100
            _temperature = resultArray[2] + resultArray[3] / 100

        }

        //wait 2 sec after query 
        basic.pause(2000)

    }

    //% blockId="smarthon_get_temperature_house" 
    //% block="Get temperature (°C) at Pin %pin"
    //% weight=79	

    export function getTemperature(pin: DigitalPin): number {

        dht11_queryData(pin)
        return Math.round(_temperature)
    }


    //% blockId="smarthon_get_humidity_house" 
    //% block="Get humidity (percentage) at Pin %pin"
    //% weight=78	

    export function getHumidity(pin: DigitalPin): number {
        dht11_queryData(pin)
        return Math.round(_humidity)
    }

    //% blockId="smarthon_get_heat" 
    //% block="Get heat (index) at %pin"
    //% weight=77		
    //% blockHidden=true

    export function getHeat(pin: DigitalPin): number {
        let T = getTemperature(pin);
        let H = getHumidity(pin);
        heat_variable = -43.379 + 2.09401523 * T + 10.14333127 * H + -0.22475541 * T * H + -6.3783 * 0.001 * T * T + -5.481717 * 0.01 * H * H + 1.22874 * 0.001 * T * T * H + 8.5282 * 0.0001 * T * H * H + -1.99 * 0.000001 * T * T * H * H;
        return heat_variable;
    }



    //% blockId=read_motion_sensor
    //% block="Get motion (triggered or not) at Pin %motion_pin"
    //% weight=40
    export function read_motion_sensor(motion_pin: AnalogPin): boolean {
        temp_pin = parseInt(motion_pin.toString())
        temp = pins.analogReadPin(temp_pin)
        if (temp > 800)
            return true
        else return false
    }

    //% blockId="smarthon_get_flame" 
    //% block="Get flame detection at Pin %pin"
    //% weight=45	
    export function getFlame(pin: AnalogPin): boolean {
        flame_variable = pins.analogReadPin(pin)
        if(flame_variable > 300){
        return true;}
        else{return false;} 
    }
    //% blockId="smarthon_get_towngas" 
    //% block="Get town gas value (intensity) at %pin"
    //% weight=73

    export function getTownGas(pin: AnalogPin): number {
        towngas_variable = pins.analogReadPin(pin);
        return towngas_variable;

    }

    //% blockId=read_distance_sensor
    //% block="Get distance unit %unit trig %trig echo %echo"
    //% weight=64
    //% trig.defl=DigitalPin.P14 echo.defl=DigitalPin.P15
    //% inlineInputMode=inline
    export function read_distance_sensor(unit: DistanceUnit, trig: DigitalPin, echo: DigitalPin, maxCmDistance = 500): number {
        // send pulse
        let d = 10;
        pins.setPull(trig, PinPullMode.PullNone);
        for (let x = 0; x < 10; x++) {
            pins.digitalWritePin(trig, 0);
            control.waitMicros(2);
            pins.digitalWritePin(trig, 1);
            control.waitMicros(10);
            pins.digitalWritePin(trig, 0);
            // read pulse
            d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);
            if (d > 0)
                break;
        }

        switch (unit) {
            case DistanceUnit.Centimeters: return Math.round(d / 58 * 1.4);
            case DistanceUnit.Inches: return Math.round(d / 148 * 1.4);
            default: return d;
        }
    }

    //% blockId="smarthon_colorful_led"
    //% block="Turn Colorful LED to %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% pin.defl=AnalogPin.P0
    //% weight=50
    //%subcategory=More
	//% blockHidden=true
    export function TurnColorfulLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }


    //% blockId="smarthon_red_LED"
    //% block="Set Red LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=49
    //%subcategory=More
    //% blockHidden=true

    export function TurnRedLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_green_LED"
    //% block="Set Green LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=48
    //%subcategory=More
    //% blockHidden=true

    export function TurnGreenLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_yellow_LED"
    //% block="Set Yellow LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=47
    //%subcategory=More
    //% blockHidden=true


    export function TurnYellowLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }


    //% blockId="smarthon_buzzer"
    //% block="Set Buzzer to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=46
    //%subcategory=More	
    //% blockHidden=true

    export function TurnBuzzer(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_motorfan"
    //% block="Set Motor fan with speed %intensity at S1 %pin1 S2 %pin2"
    //% intensity.min=-1023 intensity.max=1023
    //% pin1.defl=AnalogPin.P14 pin2.defl=AnalogPin.P15
    //% weight=45	
    //%subcategory=More

    export function TurnMotorCW(intensity: number, pin1: AnalogPin, pin2: AnalogPin): void {
        if (intensity > 0) {
            pins.analogWritePin(pin1, intensity);
            pins.analogWritePin(pin2, 0);
        }
        else if (intensity < 0) {
            intensity = Math.abs(intensity);
            pins.analogWritePin(pin1, 0);
            pins.analogWritePin(pin2, intensity);
        }
        else {
            pins.analogWritePin(pin1, 0);
            pins.analogWritePin(pin2, 0);
        }
    }



    //% blockId="smarthon_180_servo"
    //% block="Turn 180° Servo to %degree degree at %pin"
    //% intensity.min=0 intensity.max=180
    //% weight=43
    //%subcategory=More	

    export function Turn180Servo(intensity: number, pin: AnalogPin): void {

        pins.servoWritePin(pin, intensity)
    }


    //% blockId="smarthon_360_servo"
    //% block="Turn 360° Servo with %direction direction|speed %speed at %pin"
    //% weight=42
    //%subcategory=More

    export function Turn360Servo(direction: ServoDirection, speed: ServoSpeed, pin: AnalogPin): void {

        switch (direction) {

            case ServoDirection.clockwise:
                switch (speed) {
                    case ServoSpeed.level0:
                        pins.servoWritePin(pin, 90)
                        break
                    case ServoSpeed.level1:
                        pins.servoWritePin(pin, 83)
                        break
                    case ServoSpeed.level2:
                        pins.servoWritePin(pin, 82)
                        break
                    case ServoSpeed.level3:
                        pins.servoWritePin(pin, 80)
                        break
                }
                break

            case ServoDirection.anticlockwise:
                switch (speed) {
                    case ServoSpeed.level0:
                        pins.servoWritePin(pin, 90)
                        break
                    case ServoSpeed.level1:
                        pins.servoWritePin(pin, 96)
                        break
                    case ServoSpeed.level2:
                        pins.servoWritePin(pin, 97)
                        break
                    case ServoSpeed.level3:
                        pins.servoWritePin(pin, 98)
                        break
                }
                break
        }
    }
    
    
    
    //% blockId="button" 
    //% block="When Button at %pin pressed"	 
    //% weight=10
    export function Button(pin:DigitalPin,handler:()=>void){
        pins.onPulsed(pin, PulseValue.High,handler)
    }

}