/**
 * Custom blocks
 */
//% weight=98 color=#ffba52 icon="\uf015" block="SmartHome"
namespace House {
    let light_variable = 0
    let temperature_variable = 0
    let humidity_variable = 0
    let heat_variable = 0
    let button_variable = 0
    let motion_variable = 0
    let flame_variable
    let towngas_variable = 0
    let temp_IAQ = 0
    let hum_IAQ = 0
    let temp_pin = 0
    let temp = 0
    let _temperature: number = -999.0
    let _humidity: number = -999.0
    let _readSuccessful: boolean = false
    let _firsttime: boolean = true
    let _last_successful_query_temperature: number = 0
    let _last_successful_query_humidity: number = 0


    export enum ServoDirection {
        //% block="clockwise"
        clockwise,
        //% block="anti-clockwise"
        anticlockwise
    }
    export enum Temp_degree {
        //% block="°C"
        degree_Celsius,
        //% block="°F"
        degree_Fahrenheit
    }
    export enum DHT11dataType {
        //% block="temperature"
        temperature,
        //% block="humidity"
        humidity
    }

    export enum PressButtonList {
        //% block="P0"
        b0 = 0,
        //% block="P1"
        b1 = 1,
        //% block="P2"
        b2 = 2,
        //% block="P12"
        //b12 = 12,
        //% block="P13"
        //b13 = 13,
        //% block="P14"
        //b14 = 14,
        //% block="P15"
        //b15 = 15
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


    /**
     * Read the light intensity (in percentage) result form light sensor
     */
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

        if (_firsttime == true) {
            _firsttime = false
            dht11_queryData(dataPin)
        }

        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)
        _humidity = 0
        _temperature = 0
        _readSuccessful = false

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol
        control.waitMicros(18000)
        pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin)
        control.waitMicros(40)
        if (pins.digitalReadPin(dataPin) == 1) {
            //if no respone,exit the loop to avoid Infinity loop
            pins.setPull(dataPin, PinPullMode.PullNone) //release pull up
        }
        else {
            pins.setPull(dataPin, PinPullMode.PullNone) //release pull up

            while (pins.digitalReadPin(dataPin) == 0); //sensor response
            while (pins.digitalReadPin(dataPin) == 1); //sensor response

            //-------------V2---------------------------------
            //read data (5 bytes)
            if (control.ramSize() > 20000) {
                for (let index = 0; index < 40; index++) {
                    startTime = input.runningTimeMicros()
                    while (pins.digitalReadPin(dataPin) == 1) {
                        endTime = input.runningTimeMicros()
                        if ((endTime - startTime) > 150) {
                            //OLED.writeStringNewLine("break")
                            break;
                        }
                    };
                    while (pins.digitalReadPin(dataPin) == 0) {
                        endTime = input.runningTimeMicros()
                        if ((endTime - startTime) > 150) {
                            //OLED.writeStringNewLine("break")
                            break;
                        }
                    };
                    control.waitMicros(28)
                    //if sensor pull up data pin for more than 28 us it means 1, otherwise 0
                    if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
                }
            }
            //-------------------V1------------------------
            else if (control.ramSize() < 20000) {
                for (let index = 0; index < 40; index++) {
                    while (pins.digitalReadPin(dataPin) == 1);
                    while (pins.digitalReadPin(dataPin) == 0);
                    control.waitMicros(28)
                    //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                    if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
                }
            }


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

            //set data variable if checksum ok
            if (_readSuccessful) {
                //OLED.writeStringNewLine("success")
                _humidity = resultArray[0] + resultArray[1] / 100
                _temperature = resultArray[2] + resultArray[3] / 100
                _last_successful_query_humidity = _humidity
                _last_successful_query_temperature = _temperature
            } else {
                //OLED.writeStringNewLine("fail")
                _humidity = _last_successful_query_humidity
                _temperature = _last_successful_query_temperature
            }

        }
        //wait 1.5 sec after query 
        basic.pause(1500)
    }


    /**
     * Query the temperature and humidity infromation from DHT11 Temperature and Humidity sensor
     *  
     */
    //% block="Read Temperature & Humidity Sensor at pin %dht11pin|"
    //% weight=90
    //% group="Temperature and Humidity Sensor (DHT11)"
    //% blockGap=12
    export function readDHT11(dht11pin: DigitalPin): void {
        // querydata
        dht11_queryData(dht11pin)
    }



    /**
     * Get the Temperature value (degree in Celsius or Fahrenheit) after queried the Temperature and Humidity sensor
     */

    //% block="Get Temperature |%temp_degree"
    //% weight=79
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function readTemperatureData(temp_degree: Temp_degree): number {
        // querydata
        if (temp_degree == Temp_degree.degree_Celsius) {
            return Math.round(_last_successful_query_temperature)
        }
        else {
            return Math.round((_last_successful_query_temperature * 1.8) + 32)
        }
    }

    /**
     * Get the humidity value (in percentage) after queried the Temperature and Humidity sensor
     */
    //% block="Get Humidity"
    //% weight=78
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function readHumidityData(): number {
        // querydata

        return Math.round(_last_successful_query_humidity)


    }


    /**
     * Basic on the temperature and humidity to calculate the IAQ score, detail can refer to online documentation
     */
    //% blockId="smarthon_get_IAQ" 
    //% block="Get IAQ Score"
    //% weight=77		
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function getIAQ(): number {

        let t = Math.round(_last_successful_query_temperature)
        let h = _last_successful_query_humidity
        //OLED.writeNumNewLine(t)
        //OLED.writeNumNewLine(h)
        //get temp_IAQ
        if (t < 1 || t > 36) { temp_IAQ = 0 }
        else if ((t >= 1 && t <= 5) || (t >= 34 && t <= 36)) { temp_IAQ = 20 }
        else if ((t >= 6 && t <= 10) || (t >= 29 && t <= 33)) { temp_IAQ = 40 }
        else if ((t >= 11 && t <= 16) || (t >= 26 && t <= 28)) { temp_IAQ = 60 }
        else if ((t >= 17 && t <= 19) || (t >= 23 && t <= 25)) { temp_IAQ = 80 }
        else if ((t >= 20 && t <= 22)) { temp_IAQ = 100 }
        //get hum_IAQ
        if (h < 20 || h > 90) { hum_IAQ = 0 }
        else if ((h >= 20 && h <= 29) || (h >= 86 && h <= 90)) { hum_IAQ = 20 }
        else if ((h >= 30 && h <= 39) || (h >= 80 && h <= 85)) { hum_IAQ = 40 }
        else if ((h >= 40 && h <= 49) || (h >= 76 && h <= 79)) { hum_IAQ = 60 }
        else if ((h >= 50 && h <= 59) || (h >= 71 && h <= 75)) { hum_IAQ = 80 }
        else if ((h >= 60 && h <= 70)) { hum_IAQ = 100 }

        return Math.round((temp_IAQ + hum_IAQ) / 2)



    }

    //% blockId="smarthon_get_heat" 
    //% block="Get heat (index) at %pin"
    //% weight=77		
    //% blockHidden=true

    export function getHeat(pin: DigitalPin): number {
        // let T = getTemperature(pin);
        // let H = getHumidity(pin);
        // heat_variable = -43.379 + 2.09401523 * T + 10.14333127 * H + -0.22475541 * T * H + -6.3783 * 0.001 * T * T + -5.481717 * 0.01 * H * H + 1.22874 * 0.001 * T * T * H + 8.5282 * 0.0001 * T * H * H + -1.99 * 0.000001 * T * T * H * H;
        // return heat_variable;
        return 0;
    }



    /**
     * Read the detection result of motion sensor, return true when something moving, otherwise return false
     */
    //% blockId=read_motion_sensor
    //% block="Get motion (triggered or not) at Pin %motion_pin"
    //% weight=40
    export function read_motion_sensor(motion_pin: DigitalPin): boolean {
        //temp_pin = parseInt(motion_pin.toString())
        temp = pins.digitalReadPin(motion_pin)
        if (temp==1)
            return true
        else return false
    }

    /** 
     * Read the detection result of flame sensor, return true when detect flame, otherwise return false
     */
    //% blockId="smarthon_get_flame" 
    //% block="Get flame detection at Pin %pin"
    //% weight=45	
    export function getFlame(pin: DigitalPin): boolean {
        flame_variable = pins.digitalReadPin(pin)
        if (flame_variable == 1) {
            return true;
        }
        else { return false; }
    }
    //% blockId="smarthon_get_towngas" 
    //% block="Get town gas value (intensity) at %pin"
    //% weight=73
    //% blockHidden=true

    export function getTownGas(pin: AnalogPin): number {
        towngas_variable = pins.analogReadPin(pin);
        return towngas_variable;

    }


    /**
     * Read the distance data from the ultrasonic distance sensor, can return data in different unit.
     */
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

    /**
     *  Turn on mono tone Buzzer to make the noise
     */
    //% blockId="smarthon_buzzer"
    //% block="Set Buzzer to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=46
    //%subcategory=More	
    //% blockHidden=true

    export function TurnBuzzer(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }


    /**
     * Control the Motor to spin with specific speed
     */
    //% blockId="smarthon_motorfan"
    //% block="Set Motor fan with speed %intensity at %pin1"
    //% intensity.min=0 intensity.max=1023
    //% pin1.defl=AnalogPin.P1
    //% weight=45	
    //%subcategory=More

    export function TurnMotor(intensity: number, pin1: AnalogPin): void {
        pins.analogWritePin(pin1, intensity);
    }



    /**
    *  Control the 180 degree servo to specific angle
    */

    //% blockId="smarthon_180_servo"
    //% block="Turn 180° Servo to %degree degree at %pin"
    //% intensity.min=0 intensity.max=180
    //% weight=43
    //%subcategory=More	

    export function Turn180Servo(intensity: number, pin: AnalogPin): void {

        pins.servoWritePin(pin, intensity)
    }

    /**
     * Control the 360 degree servo to rotate with direction and Speed
     * 
     */

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

    /**
     * When the Pin is pressed, it will trigger the function inside the block
     */

    //% blockId="button" 
    //% block="When Button at %pin pressed"	 
    //% weight=10
    export function Button(pin: PressButtonList, handler: () => void) {
        let buttonName;
        switch (pin) {
            case PressButtonList.b0:
                buttonName = DigitalPin.P0
                break
            case PressButtonList.b1:
                buttonName = DigitalPin.P1
                break
            case PressButtonList.b2:
                buttonName = DigitalPin.P2
                break
            /*
			case PressButtonList.b12:
                buttonName = DigitalPin.P12
                break
            case PressButtonList.b13:
                buttonName = DigitalPin.P13
                break
            case PressButtonList.b14:
                buttonName = DigitalPin.P14
                break
            case PressButtonList.b15:
                buttonName = DigitalPin.P15
                break
			*/
            default:
                buttonName = DigitalPin.P0
                break
        }

        pins.onPulsed(buttonName, PulseValue.High, handler)
    }

}