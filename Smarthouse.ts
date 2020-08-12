/**
 * Custom blocks
 */
//% color=#ffba52 icon="\uf015" block="Smarthouse"
namespace House {
    let light_variable = 0
    let temperature_variable = 0
    let humidity_variable = 0
    let heat_variable = 0
    let button_variable = 0
    let motion_variable = 0
    let flame_variable = 0
    let towngas_variable = 0

    export enum ServoDirection {
        //% block="clockwise"
        clockwise,
        //% block="anti-clockwise"
        anticlockwise
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

    export enum GeneralSensorPort {
        //% block="A1"
        a1,
        //% block="A2"
        a2,
        //% block="A3"
        a3,
        //% block="A6"
        a6,
        //% block="A7"
        a7
    }

    export enum GeneralActuatorPort {
        //% block="P0"
        p0,
        //% block="P1"
        p1,
        //% block="P2"
        p2,
        //% block="P13"
        p13,
        //% block="P15"
        p15,
        //% block="P16"
        p16
    }

    //% blockId="smarthon_get_light_house" 
    //% block="Get light value (intensity) at %pin"
    //% weight=80	
    //% blockGap=7	

    export function getLight(pin: AnalogPin): number {
        light_variable = pins.analogReadPin(pin)
        return light_variable;
    }

    //% blockId="smarthon_get_temperature_house" 
    //% block="Get temperature (°C) at %pin"
    //% weight=79
    //% blockGap=7	

    export function getTemperature(pin: DigitalPin): number {

        pins.digitalWritePin(pin, 0)
        basic.pause(18)
        let i = pins.digitalReadPin(pin)
        pins.setPull(pin, PinPullMode.PullUp);
        let dhtvalue1 = 0;
        let dhtcounter1 = 0;
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);
        for (let i = 0; i <= 32 - 1; i++) {
            while (pins.digitalReadPin(pin) == 0);
            dhtcounter1 = 0
            while (pins.digitalReadPin(pin) == 1) {
                dhtcounter1 += 1;
            }
            if (i > 15) {
                if (dhtcounter1 > 2) {
                    dhtvalue1 = dhtvalue1 + (1 << (31 - i));
                }
            }
        }
        temperature_variable = ((dhtvalue1 & 0x0000ff00) >> 8);
        basic.pause(500)
        return temperature_variable;
    }


    //% blockId="smarthon_get_humidity_house" 
    //% block="Get humidity (percentage) at %pin"
    //% weight=78	
    //% blockGap=7	

    export function getHumidity(pin: DigitalPin): number {
        pins.digitalWritePin(pin, 0)
        basic.pause(18)
        let i = pins.digitalReadPin(pin)
        pins.setPull(pin, PinPullMode.PullUp);
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        let value = 0;
        let counter = 0;

        for (let i = 0; i <= 8 - 1; i++) {
            while (pins.digitalReadPin(pin) == 0);
            counter = 0
            while (pins.digitalReadPin(pin) == 1) {
                counter += 1;
            }
            if (counter > 3) {
                value = value + (1 << (7 - i));
            }
        }
        humidity_variable = value;
        basic.pause(500)
        return humidity_variable;
    }

    //% blockId="smarthon_get_heat" 
    //% block="Get heat (index) at %pin"
    //% weight=77	
    //% blockGap=7	

    export function getHeat(pin: DigitalPin): number {
        let T = getTemperature(pin);
        let H = getHumidity(pin);
        heat_variable = -43.379 + 2.09401523 * T + 10.14333127 * H + -0.22475541 * T * H + -6.3783 * 0.001 * T * T + -5.481717 * 0.01 * H * H + 1.22874 * 0.001 * T * T * H + 8.5282 * 0.0001 * T * H * H + -1.99 * 0.000001 * T * T * H * H;
        return heat_variable;
    }

    //% blockId="smarthon_get_button" 
    //% block="Get button (pressed or not) at %pin"
    //% weight=76	
    //% blockGap=7	

    export function getButton(pin: AnalogPin): number {
        button_variable = pins.analogReadPin(pin);
        return button_variable;
    }


    //% blockId="smarthon_get_motion" 
    //% block="Get motion (triggered or not) at %pin"
    //% weight=75	
    //% blockGap=7	

    export function getMotion(pin: AnalogPin): number {
        motion_variable = pins.analogReadPin(pin);
        return motion_variable;
    }

    //% blockId="smarthon_get_flame" 
    //% block="Get flame (present or not) at %pin"
    //% weight=74	
    //% blockGap=7	

    export function getFlame(pin: AnalogPin): number {
        flame_variable = pins.analogReadPin(pin)
        return flame_variable;
    }
    //% blockId="smarthon_get_towngas" 
    //% block="Get town gas value (intensity) at %pin"
    //% weight=73

    export function getTownGas(pin: AnalogPin): number {
        towngas_variable = pins.analogReadPin(pin);
        return towngas_variable;

    }

    //% blockId="smarthon_get_generalsensor" 
    //% block="Get general sensor value port %port"
    //% weight=72
    //% blockGap=7	

    export function getGeneralSensor(port: GeneralSensorPort): number {
        switch (port) {
            case GeneralSensorPort.a1:
                return light_variable;
                break
            case GeneralSensorPort.a2:
                return button_variable;
                break
            case GeneralSensorPort.a3:
                return motion_variable;
                break
            case GeneralSensorPort.a6:
                return flame_variable;
                break
            case GeneralSensorPort.a7:
                return towngas_variable;
                break
        }
    }

    //% blockId="smarthon_red_LED"
    //% block="Set Red LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=49
    //%subcategory=More
    //% blockGap=7	

    export function TurnRedLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_green_LED"
    //% block="Set Green LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=48
    //%subcategory=More
    //% blockGap=7	

    export function TurnGreenLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_yellow_LED"
    //% block="Set Yellow LED to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=47
    //%subcategory=More
    //% blockGap=7	


    export function TurnYellowLED(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }


    //% blockId="smarthon_buzzer"
    //% block="Set Buzzer to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=46
    //%subcategory=More	

    export function TurnBuzzer(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }

    //% blockId="smarthon_motorfan_cw"
    //% block="Set Motor fan clockwisely to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=45	
    //%subcategory=More
    //% blockGap=7	

    export function TurnMotorCW(intensity: number, pin: AnalogPin): void {
        pins.analogWritePin(pin, intensity);
    }


    //% blockId="smarthon_motorfan_acw"
    //% block="Set Motor fan anti-clockwisely to intensity %intensity at %pin"
    //% intensity.min=0 intensity.max=1023
    //% weight=44
    //%subcategory=More
    //% blockGap=7	

    export function TurnMotorACW(intensity: number, pin: AnalogPin): void {

        pins.analogWritePin(pin, intensity);
    }


    //% blockId="smarthon_180_servo"
    //% block="Set 180° Servo to degree %degree at %pin"
    //% intensity.min=0 intensity.max=180
    //% weight=43
    //%subcategory=More
    //% blockGap=7	

    export function Turn180Servo(intensity: number, pin: AnalogPin): void {

        pins.servoWritePin(pin, intensity)
    }


    //% blockId="smarthon_360_servo"
    //% block="Set 360° Servo to direction %direction|speed %speed at %pin"
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

    //% blockId="smarthon_house_general_output"
    //% block="Set general output port %port|intensity %intensity"
    //% intensity.min=0 intensity.max=1023
    //% weight=41
    //%subcategory=More

    export function TurnGeneralOutput(port: GeneralActuatorPort, intensity: number): void {
        switch (port) {
            case GeneralActuatorPort.p0:
                pins.analogWritePin(AnalogPin.P0, intensity);
                break
            case GeneralActuatorPort.p1:
                pins.analogWritePin(AnalogPin.P1, intensity);
                break
            case GeneralActuatorPort.p2:
                pins.analogWritePin(AnalogPin.P2, intensity);
                break
            case GeneralActuatorPort.p13:
                pins.analogWritePin(AnalogPin.P13, intensity);
                break
            case GeneralActuatorPort.p15:
                pins.analogWritePin(AnalogPin.P15, intensity);
                break
            case GeneralActuatorPort.p16:
                pins.analogWritePin(AnalogPin.P16, intensity);
                break
        }
    }



}