// tests go here; this will not be compiled when this package is used as a library

/* 
Test procedure:
1. get light value (percentage) at Pin
2. get flame detection at pin
3. get temperature at pin
4. get humidity at pin
*/

//get the light value, flame detection, temperature and humidity
basic.forever(function () {
    House.readDht11(DigitalPin.P0)
    basic.showString("Light:" + House.getLight(AnalogPin.P1))
    if (House.getFlame(DigitalPin.P2)) {
        basic.showIcon(IconNames.Happy)
    } else {
        basic.showIcon(IconNames.Sad)
    }
    basic.showString("Distance:" + House.read_distance_sensor_home(House.DistanceUnit.Centimeters, DigitalPin.P14, DigitalPin.P15))
    basic.showString("Temperature:" + House.readTemperatureData(House.TempDegree.DegreeCelsius))
    basic.showString("Humidity:" + House.readHumidityData())
    basic.pause(1000)
})
