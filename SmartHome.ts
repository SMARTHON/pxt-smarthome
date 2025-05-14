/**
 * Sensor block
 * SmartHome expansion module for Micro:bit
 */
//% weight=98 color=#ffba52 icon="\uf015" block="SmartHome"
namespace House {
    let lightVariable = 0;
    let temperatureVariable = 0;
    let humidityVariable = 0;
    let heatVariable = 0;
    let buttonVariable = 0;
    let motionVariable = 0;
    let flameVariable = 0;
    let towngasVariable = 0;
    let tempIaq = 0;
    let humIaq = 0;
    let tempPin = 0;
    let temp = 0;
    let temperature = -999.0;
    let humidity = -999.0;
    let readSuccessful = false;
    let firstTime = true;
    let lastSuccessfulQueryTemperature = 0;
    let lastSuccessfulQueryHumidity = 0;

    export enum ServoDirection {
        //% block="clockwise"
        Clockwise,
        //% block="anti-clockwise"
        Anticlockwise
    }

    export enum TempDegree {
        //% block="°C"
        DegreeCelsius,
        //% block="°F"
        DegreeFahrenheit
    }

    export enum Dht11DataType {
        //% block="temperature"
        Temperature,
        //% block="humidity"
        Humidity
    }

    export enum PressButtonList {
        //% block="P0"
        B0 = 0,
        //% block="P1"
        B1 = 1,
        //% block="P2"
        B2 = 2,
        //% block="P12"
        //B12 = 12,
        //% block="P13"
        //B13 = 13,
        //% block="P14"
        //B14 = 14,
        //% block="P15"
        //B15 = 15
    }

    export enum ServoSpeed {
        //% blockId=servo360_level_0
        //% block="Stop"
        Level0 = 0,
        //% blockId=servo360_level_1
        //% block="Level 1"
        Level1 = 1,
        //% blockId=servo360_level_2
        //% block="Level 2"
        Level2 = 2,
        //% blockId=servo360_level_3
        //% block="Level 3"
        Level3 = 3
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
     * Read the light intensity (in percentage) result from light sensor
     * @param pin to get the analog value from pin
     */
    //% blockId=smarthon_get_light_house
    //% block="get light value (percentage) at pin %pin"
    //% weight=65	
    export function getLight(pin: AnalogPin): number {
        lightVariable = Math.round(pins.map(
            pins.analogReadPin(pin),
            0,
            1023,
            0,
            100
        ));
        return lightVariable;
    }

    //% block="get DHT11 at Pin %dataPin|"
    function dht11QueryData(dataPin: DigitalPin) {
        if (firstTime) {
            firstTime = false;
            dht11QueryData(dataPin);
        }

        // Initialize
        let startTime = 0;
        let endTime = 0;
        let checksum = 0;
        let checksumTmp = 0;
        let dataArray: boolean[] = [];
        let resultArray: number[] = [];
        for (let index = 0; index < 40; index++) dataArray.push(false);
        for (let index = 0; index < 5; index++) resultArray.push(0);
        humidity = 0;
        temperature = 0;
        readSuccessful = false;

        // Request data
        pins.digitalWritePin(dataPin, 0); // Begin protocol
        control.waitMicros(18000);
        pins.setPull(dataPin, PinPullMode.PullUp); // Pull up data pin if needed
        pins.digitalReadPin(dataPin);
        control.waitMicros(40);
        if (pins.digitalReadPin(dataPin) == 1) {
            //if no respone,exit the loop to avoid Infinity loop
            pins.setPull(dataPin, PinPullMode.PullNone); // Release pull up
        } else {
            pins.setPull(dataPin, PinPullMode.PullNone); // Release pull up

            while (pins.digitalReadPin(dataPin) == 0); // Sensor response
            while (pins.digitalReadPin(dataPin) == 1); // Sensor response

            //-------------V2---------------------------------
            // Read data (5 bytes)
            if (control.ramSize() > 20000) {
                for (let index = 0; index < 40; index++) {
                    startTime = input.runningTimeMicros();
                    while (pins.digitalReadPin(dataPin) == 1) {
                        endTime = input.runningTimeMicros();
                        if ((endTime - startTime) > 150) break;
                    }
                    while (pins.digitalReadPin(dataPin) == 0) {
                        endTime = input.runningTimeMicros();
                        if ((endTime - startTime) > 150) break;
                    }
                    control.waitMicros(28);
                    //if sensor pull up data pin for more than 28 us it means 1, otherwise 0
                    if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true;
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


            // Convert byte number array to integer
            for (let index = 0; index < 5; index++)
                for (let index2 = 0; index2 < 8; index2++)
                    if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2);

            // Verify checksum
            checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3];
            checksum = resultArray[4];
            if (checksumTmp >= 512) checksumTmp -= 512;
            if (checksumTmp >= 256) checksumTmp -= 256;
            if (checksum == checksumTmp) readSuccessful = true;

            // Set data variable if checksum ok
            if (readSuccessful) {
                humidity = resultArray[0] + resultArray[1] / 100;
                temperature = resultArray[2] + resultArray[3] / 100;
                lastSuccessfulQueryHumidity = humidity;
                lastSuccessfulQueryTemperature = temperature;
            } else {
                humidity = lastSuccessfulQueryHumidity;
                temperature = lastSuccessfulQueryTemperature;
            }
        }
        // Wait 1.5 sec after query 
        basic.pause(1500);
    }

    /**
     * Query the temperature and humidity information from DHT11 Temperature and Humidity sensor
     * @param dht11Pin Digital Read dht data
     */
    //% block="read temperature & humidity sensor at pin %dht11Pin|"
    //% weight=90
    //% group="Temperature and Humidity Sensor (DHT11)"
    //% blockGap=12
    export function readDht11(dht11Pin: DigitalPin): void {
        dht11QueryData(dht11Pin);
    }

    /**
     * Get the Temperature value (degree in Celsius or Fahrenheit) after queried the Temperature and Humidity sensor
     * @param tempDegree is the number of temperature
     */
    //% block="get temperature |%tempDegree"
    //% weight=79
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function readTemperatureData(tempDegree: TempDegree): number {
        if (tempDegree == TempDegree.DegreeCelsius) {
            return Math.round(lastSuccessfulQueryTemperature);
        } else {
            return Math.round((lastSuccessfulQueryTemperature * 1.8) + 32);
        }
    }

    /**
     * Get the humidity value (in percentage) after queried the Temperature and Humidity sensor
     */
    //% block="get humidity"
    //% weight=78
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function readHumidityData(): number {
        return Math.round(lastSuccessfulQueryHumidity);
    }

    /**
     * Basic on the temperature and humidity to calculate the IAQ score, detail can refer to online documentation
     */
    //% blockId=smarthon_get_IAQ
    //% block="get IAQ score"
    //% weight=77		
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function getIAQ(): number {

        let t = Math.round(lastSuccessfulQueryTemperature)
        let h = lastSuccessfulQueryHumidity
        //OLED.writeNumNewLine(t)
        //OLED.writeNumNewLine(h)
        //get temp_IAQ
        if (t < 1 || t > 36) { tempIaq = 0 }
        else if ((t >= 1 && t <= 5) || (t >= 34 && t <= 36)) { tempIaq = 20 }
        else if ((t >= 6 && t <= 10) || (t >= 29 && t <= 33)) { tempIaq = 40 }
        else if ((t >= 11 && t <= 16) || (t >= 26 && t <= 28)) { tempIaq = 60 }
        else if ((t >= 17 && t <= 19) || (t >= 23 && t <= 25)) { tempIaq = 80 }
        else if ((t >= 20 && t <= 22)) { tempIaq = 100 }
        //get hum_IAQ
        if (h < 20 || h > 90) { humIaq = 0 }
        else if ((h >= 20 && h <= 29) || (h >= 86 && h <= 90)) { humIaq = 20 }
        else if ((h >= 30 && h <= 39) || (h >= 80 && h <= 85)) { humIaq = 40 }
        else if ((h >= 40 && h <= 49) || (h >= 76 && h <= 79)) { humIaq = 60 }
        else if ((h >= 50 && h <= 59) || (h >= 71 && h <= 75)) { humIaq = 80 }
        else if ((h >= 60 && h <= 70)) { humIaq = 100 }

        return Math.round((tempIaq + humIaq) / 2)
    }

    //% blockId=smarthon_get_heat
    //% block="get heat (index) at %pin"
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
     * @param motion_pin is the motion changing at the front
     */
    //% blockId=read_motion_sensor_home
    //% block="get motion (triggered or not) at pin %motion_pin"
    //% weight=40
    export function read_motion_sensor_home(motion_pin: AnalogPin): boolean {
        tempPin = parseInt(motion_pin.toString())
        temp = pins.analogReadPin(tempPin)
        if (temp > 800)
            return true
        else return false
    }

    /** 
     * Read the detection result of flame sensor, return true when detect flame, otherwise return false
     * @param pin is read the flame sensor pin
     */
    //% blockId=smarthon_get_flame
    //% block="get flame detection at pin %pin"
    //% weight=45	
    export function getFlame(pin: DigitalPin): boolean {
        flameVariable = pins.digitalReadPin(pin)
        if (flameVariable == 1) {
            return true;
        }
        else { return false; }
    }
    //% blockId=smarthon_get_towngas
    //% block="get town gas value (intensity) at %pin"
    //% weight=73
    //% blockHidden=true

    export function getTownGas(pin: AnalogPin): number {
        towngasVariable = pins.analogReadPin(pin);
        return towngasVariable;
    }

    /**
     * Read the distance data from the ultrasonic distance sensor, can return data in different unit.
     * @param unit the distance unit eg: cm or inches
     * @param trig tragger to send the ultrasonic signal
     * @param echo tragger to receive the ultrasonic signal
     * @param maxCmDistance is the maximum distance can be detected
     */
    //% blockId=read_distance_sensor_home
    //% block="get distance unit %unit trig %trig echo %echo"
    //% weight=64
    //% trig.defl=DigitalPin.P14 echo.defl=DigitalPin.P15
    //% inlineInputMode=inline
    export function read_distance_sensor_home(unit: DistanceUnit, trig: DigitalPin, echo: DigitalPin, maxCmDistance = 500): number {
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

    /**
     * change the light intensity
     * @param intensity the intensity of light
     * @param pin the pin of light
     */
    //% blockId=smarthon_colorful_led
    //% block="turn colorful LED to %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% pin.defl=AnalogPin.P0
    //% weight=50
    //%subcategory=More
    //% blockHidden=true
    export function TurnColorfulLED(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }

    //% blockId=smarthon_red_LED
    //% block="set red LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=49
    //%subcategory=More
    //% blockHidden=true
    export function TurnRedLED(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }

    //% blockId=smarthon_green_LED
    //% block="set green LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=48
    //%subcategory=More
    //% blockHidden=true
    export function TurnGreenLED(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }

    //% blockId=smarthon_yellow_LED
    //% block="set yellow LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=47
    //%subcategory=More
    //% blockHidden=true
    export function TurnYellowLED(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }

    /**
     *  Turn on mono tone Buzzer to make the noise
     *  @param intensity change the intensity of Buzzer noise
     */
    //% blockId=smarthon_buzzer
    //% block="set buzzer to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=46
    //%subcategory=More	
    //% blockHidden=true
    export function TurnBuzzer(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }

    /**
     * Control the Motor to spin with specific speed
     * @param intensity change the intensity of Motor speed
     */
    //% blockId=smarthon_motorfan
    //% block="set motor fan with speed %intensity at %pin1"
    //% intensity.min=0 intensity.max=1023
    //% pin1.defl=AnalogPin.P1
    //% weight=45	
    //%subcategory=More
    export function TurnMotor(intensity: number, pin1: AnalogPin): void {
        pins.analogWritePin(pin1, intensity);
    }

    /**
    * Control the 180 degree servo to specific angle
    * @param intensity is the servo turning to the angle
    */
    //% blockId=smarthon_180_servo
    //% block="turn 180° servo to %degree degree at %pin"
    //% intensity.min=0 intensity.max=180
    //% weight=43
    //%subcategory=More	
    export function Turn180Servo(intensity: number, pin: AnalogPin): void {
        pins.servoWritePin(pin, intensity)
    }

    /**
     * Control the 360 degree servo to rotate with direction and Speed
     * @param direction clockwise or anti-clockwise
     * @param speed how fast the servo turning
     * @param pin is control the servo pin
     */
    //% blockId=smarthon_360_servo
    //% block="turn 360° servo with %direction direction|speed %speed at %pin"
    //% weight=42
    //%subcategory=More
    export function Turn360Servo(direction: ServoDirection, speed: ServoSpeed, pin: AnalogPin): void {
        switch (direction) {
            case ServoDirection.Clockwise:
                switch (speed) {
                    case ServoSpeed.Level0:
                        pins.servoWritePin(pin, 90)
                        break
                    case ServoSpeed.Level1:
                        pins.servoWritePin(pin, 83)
                        break
                    case ServoSpeed.Level2:
                        pins.servoWritePin(pin, 82)
                        break
                    case ServoSpeed.Level3:
                        pins.servoWritePin(pin, 80)
                        break
                }
                break
            case ServoDirection.Anticlockwise:
                switch (speed) {
                    case ServoSpeed.Level0:
                        pins.servoWritePin(pin, 90)
                        break
                    case ServoSpeed.Level1:
                        pins.servoWritePin(pin, 96)
                        break
                    case ServoSpeed.Level2:
                        pins.servoWritePin(pin, 97)
                        break
                    case ServoSpeed.Level3:
                        pins.servoWritePin(pin, 98)
                        break
                }
                break
        }
    }

    /**
     * When the Pin is pressed, it will trigger the function inside the block
     * @param pin is read the button state
     */
    //% blockId=button
    //% block="when button at %pin pressed"	 
    //% weight=10
    export function Button(pin: PressButtonList, handler: () => void) {
        let buttonName;
        switch (pin) {
            case PressButtonList.B0:
                buttonName = DigitalPin.P0
                break
            case PressButtonList.B1:
                buttonName = DigitalPin.P1
                break
            case PressButtonList.B2:
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