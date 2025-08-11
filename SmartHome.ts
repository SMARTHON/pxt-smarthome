/**
 * Sensor block
 * SmartHome expansion module for Micro:bit
 */
//% weight=98 color=#ffba52 icon="\uf015" block="SmartHome"
namespace smarthonHome {
    let lightVariable = 0;
    let temperatureVariable = 0;
    let humidityVariable = 0;
    let heatVariable = 0;
    let buttonVariable = 0;
    let flameVariable = 0;
    let towngasVariable = 0;
    let tempIaq = 0;
    let humIaq = 0;
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
        //% block="stop"
        Level0 = 0,
        //% blockId=servo360_level_1
        //% block="level 1"
        Level1 = 1,
        //% blockId=servo360_level_2
        //% block="level 2"
        Level2 = 2,
        //% blockId=servo360_level_3
        //% block="level 3"
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
    //% blockId=smarthon_home_get_light
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
    //% blockId=smarthon_home_read_dht11
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
    //% blockId=smarthon_home_read_temperature
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
    //% blockId=smarthon_home_get_humidity
    //% block="get humidity"
    //% weight=78
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function readHumidityData(): number {
        return Math.round(lastSuccessfulQueryHumidity);
    }

    /**
     * Basic on the temperature and humidity to calculate the indoor air quality score, detail can refer to online documentation
     */
    //% blockId=smarthon_home_get_IndoorAirQualityScore
    //% block="get indoor air quality score"
    //% weight=77		
    //% group="Temperature and Humidity Sensor (DHT11)"
    export function getIndoorAirQualityScore(): number {

        let t = Math.round(lastSuccessfulQueryTemperature)
        let h = lastSuccessfulQueryHumidity
        //OLED.writeNumNewLine(t)
        //OLED.writeNumNewLine(h)
        //get temp_indoor_air_quality_score
        if (t < 1 || t > 36) { tempIaq = 0 }
        else if ((t >= 1 && t <= 5) || (t >= 34 && t <= 36)) { tempIaq = 20 }
        else if ((t >= 6 && t <= 10) || (t >= 29 && t <= 33)) { tempIaq = 40 }
        else if ((t >= 11 && t <= 16) || (t >= 26 && t <= 28)) { tempIaq = 60 }
        else if ((t >= 17 && t <= 19) || (t >= 23 && t <= 25)) { tempIaq = 80 }
        else if ((t >= 20 && t <= 22)) { tempIaq = 100 }
        //get hum_indoor_air_quality_score
        if (h < 20 || h > 90) { humIaq = 0 }
        else if ((h >= 20 && h <= 29) || (h >= 86 && h <= 90)) { humIaq = 20 }
        else if ((h >= 30 && h <= 39) || (h >= 80 && h <= 85)) { humIaq = 40 }
        else if ((h >= 40 && h <= 49) || (h >= 76 && h <= 79)) { humIaq = 60 }
        else if ((h >= 50 && h <= 59) || (h >= 71 && h <= 75)) { humIaq = 80 }
        else if ((h >= 60 && h <= 70)) { humIaq = 100 }

        return Math.round((tempIaq + humIaq) / 2)
    }

    /** 
     * Read the detection result of flame sensor, return true when detect flame, otherwise return false
     * @param pin is read the flame sensor pin
     */
    //% blockId=smarthon_home_get_flame
    //% block="get flame detection at pin %pin"
    //% weight=45	
    export function getFlame(pin: DigitalPin): boolean {
        flameVariable = pins.digitalReadPin(pin)
        if (flameVariable == 1) {
            return true;
        }
        else { return false; }
    }

    /**
     * Control the Motor to spin with specific speed
     * @param intensity change the intensity of Motor speed
     */
    //% blockId=smarthon_home_motorfan
    //% block="set motor fan with speed %intensity at %pin1"
    //% intensity.min=0 intensity.max=1023
    //% pin1.defl=AnalogPin.P1
    //% weight=45	
    //%subcategory=More
    export function turnMotor(intensity: number, pin1: AnalogPin): void {
        pins.analogWritePin(pin1, intensity);
    }

    /**
    * Control the 180 degree servo to specific angle
    * @param intensity is the servo turning to the angle
    */
    //% blockId=smarthon_home_180_servo
    //% block="turn 180° servo to %degree degree at %pin"
    //% intensity.min=0 intensity.max=180
    //% weight=43
    //%subcategory=More	
    export function turn180Servo(intensity: number, pin: AnalogPin): void {
        pins.servoWritePin(pin, intensity)
    }

    /**
     * Control the 360 degree servo to rotate with direction and Speed
     * @param direction clockwise or anti-clockwise
     * @param speed how fast the servo turning
     * @param pin is control the servo pin
     */
    //% blockId=smarthon_home_360_servo
    //% block="turn 360° servo with %direction direction|speed %speed at %pin"
    //% weight=42
    //%subcategory=More
    export function turn360Servo(direction: ServoDirection, speed: ServoSpeed, pin: AnalogPin): void {
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
    //% blockId=smarthon_home_button
    //% block="when button at %pin pressed"	 
    //% weight=10
    export function readButton(pin: PressButtonList, handler: () => void) {
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