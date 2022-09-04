
# Smarthon-smartcity-kit

A PXT library for Smarthon Smart Home IoT Maker kit

## About Smarthon Smart City IoT Starter Kit

Smarthon Smart Home IoT Maker Kit for micro:bit is designed to introduce smart home concept implementation of Internet of Things (IoT) into daily life. Derived from Smarthon IoT board, you can express your creativity on building a smart house for living using in up to 13 cases from simple to IoT level, including smart saving light bulb, and home health data monitoring system in different areas like living room, bedroom, kitchen, toilet, door area etc. The provided full flexible model allows the user to create different styles of the house and add the decoration to the model easily.

## Component List

* Smarthon WiFi extension board
* Ultrasonic Distance Sensor
* Motor Fan
* Multi-Colour LED (WS2812)
* Button
* Flame Sensor
* Light Sensor
* PIR Motion Sensor
* Temperature, Humidity sensor (DHT11)
* 180ᵒ Servo
* 360ᵒ Servo
* Cardboard Model
* Crocodile Clips

## Example Tutorial

### 1. Show the light sensor reading
The light sensor will return the percentage value of luminance in environment<P>
Maxmium:100<BR>
Minmium:0<BR>

```block
basic.showNumber(House.getLight(AnalogPin.P0))
```

### 2. Show the distance sensor reading
The Distance sensor will return the distance between sensor and object<P>
Maxmium:4M<BR>
Minmium:3cm<BR>

```block
basic.showNumber(House.read_distance_sensor(House.DistanceUnit.Centimeters, DigitalPin.P14, DigitalPin.P15))
```

### 3. Show the flame sensor detection result
The flame sensor will return the detection of fire result<P>
Detected:TRUE
Not Detected:FALSE

```block
if (House.getFlame(DigitalPin.P0)) {
	basic.showString("Detected!")
}
```
### 4. Get the motion sensor detection result

The motion sensor will return the motion changing at the front<P>

Detected change:TRUE
Not Detected change:FALSE

```block
if (House.read_motion_sensor(DigitalPin.P0)) {
	basic.showString("Detected!")
}
```

### 5. Action when the Button pressed

The function in the block will be execute after the button (connected to pin) pressed<P>


```block
House.Button(House.PressButtonList.b0, function () {
    basic.showString("Pressed!")
})
```

### 6. Read and get the value of temperature and humidity
The DHT11 sensor will return the temperature and humidity in environment, and save in the variable<P>
Before showing or using the variable, need to be read the DHT11 sensor<P>
  <B>For Temperature</B><BR>
Maxmium:50 Celsius degree<BR>
Minmium:0 Celsius degree<P>
  <B>For Humidity</B><BR>
Maxmium:80%<BR>
Minmium:20%<BR>

```block
House.readDHT11(DigitalPin.P0)
basic.showNumber(House.readTemperatureData(House.Temp_degree.degree_Celsius))
basic.showNumber(House.readHumidityData())
```

### 7. Get the IAQ Score
Base on the temperature and humidity, the IAQ score will repersent the comfortability of environment<P>
Before geting the IAQ score, need to be read the DHT11 sensor<P>

```block
House.readDHT11(DigitalPin.P0)
basic.showNumber(House.getIAQ())
```
### 8. Turn on the Motor Fan
Input the value to let the motor fan work in different speed<P>
Maxmium:1023<BR>
Minmium:0<BR>


```block
input.onButtonPressed(Button.A, function () {
    House.TurnMotor(1023, AnalogPin.P1)
})
```

### 9. Control the 180 degree servo motor
Input the value to let the 180 degree servo motor move to specific position<P>
Maxmium:180<BR>
Minmium:0<BR>


```block
input.onButtonPressed(Button.A, function () {
    House.Turn180Servo(180, AnalogPin.P0)
})
```

### 10. Control the 360 degree servo motor
Choose the direction and speed to let the 360 degree servo motor to moving in specific way and speed<P>
  <B>For direction</B><BR>
Maxmium:clockwise<BR>
Minmium:anti-clockwise<P>
  <B>For Speed</B><BR>
Maxmium:Level 3<BR>
Minmium:Stop<BR>



```block
input.onButtonPressed(Button.A, function () {
    House.Turn360Servo(House.ServoDirection.clockwise, House.ServoSpeed.level3, AnalogPin.P0)
})
```


## License

MIT

## Supported targets

* for PXT/microbit

(The metadata above is needed for package search.)

