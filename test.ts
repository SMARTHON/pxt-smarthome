// tests go here; this will not be compiled when this package is used as a library

/* 
Test procedure:
1. turn on the motor
2. turn on the 180 servo
3. turn on the 360 servo
4. turn off the motor
5. get light value (percentage) at Pin
6. get temperature at pin
7. get humidity at pin
8. get IAQ at pin
9. get distance at pin
*/

//get the light value, flame detection, temperature and humidity
input.onButtonPressed(Button.A, function () {
    House.TurnMotor(512, AnalogPin.P0)
})
input.onButtonPressed(Button.AB, function () {
    House.Turn360Servo(House.ServoDirection.Clockwise, House.ServoSpeed.Level3, AnalogPin.P2)
})
input.onButtonPressed(Button.B, function () {
    House.Turn180Servo(90, AnalogPin.P1)
})
House.Button(House.PressButtonList.B2, function () {
    House.TurnMotor(0, AnalogPin.P0)
    House.Turn180Servo(0, AnalogPin.P1)
    House.Turn360Servo(House.ServoDirection.Clockwise, House.ServoSpeed.Level0, AnalogPin.P2)
})
OLED.init(128, 64)
basic.forever(function () {
    OLED.clear()
    House.readDht11(DigitalPin.P3)
    basic.showString("Light:" + House.getLight(AnalogPin.P4))
    basic.showString("dis:" + House.read_distance_sensor_home(House.DistanceUnit.Centimeters, DigitalPin.P14, DigitalPin.P15))
    basic.showString("temp:" + House.readTemperatureData(House.TempDegree.DegreeCelsius))
    basic.showString("Humidity:" + House.readHumidityData())
    basic.showString("IAQ" + House.getIAQ())
    basic.pause(1000)
})

