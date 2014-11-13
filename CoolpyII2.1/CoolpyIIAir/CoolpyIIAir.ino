#include <dht.h>
#include <SoftwareSerial.h>
SoftwareSerial mySerial(11, 12); // RX, TX
dht DHT;

char inData[100]; // Allocate some space for the string
char inChar=-1; // Where to store the character read
byte index = 0; // Index into array; where to store the character

char rinData[12]; // Allocate some space for the string
char rinChar=-1; // Where to store the character read
byte rindex = 0; // Index into array; where to store the character

String mds[4];
String instr;

String clientId="air2";

void setup() {
    Serial.begin(9600);
    mySerial.begin(9600);
    pinMode(13,OUTPUT);
}

void loop()
{
    if(Serial.available()){
      inChar = Serial.read(); // Read a character
      if(inChar =='@'){
        index=0;
      }else if(inChar == '~'){
        onData(inData);
      }else{
      inData[index] = inChar; // Store it
      index++; // Increment where to write next
      inData[index] = '\0'; // Null terminate the string
      }
    }  
    delay(10);
    while (mySerial.available()) {
        // get the new byte:
        byte in = mySerial.read();
        rinChar = in; 
        if(in == 2){
         rindex=0; 
        }else if(in == 3){
          String str = String("air|on_rf|");
           str += rinData;
           str += "|";
           str += clientId;
           char charBuf[str.length()+1];
           str.toCharArray(charBuf, str.length()+1); 
           play(charBuf);
           
           digitalWrite(13,HIGH);
           delay(500);
           digitalWrite(13,LOW);
           mySerial.flush();
        }else{
          rinData[rindex] = rinChar; // Store it
          rindex++; // Increment where to write next
          rinData[rindex] = '\0'; // Null terminate the string
        }
    }
     delay(10);
}

void play(char* sendstr){
  Serial.print('@');
  Serial.print(sendstr);
  Serial.print('~'); 
}

void onData(char* dataString){
  instr = String(dataString);
  if(instr.startsWith(clientId)){
    spilt(instr.length());
    if(mds[1].startsWith("getrs")){
    int pin = (int)mds[2].toInt();
    int skin = (int)mds[3].toInt();
     String str = String("air|re_rs|");
     str += GetDht(pin,skin);
     str += "|";
     str += clientId;
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     play(charBuf);
    }else if(mds[1].startsWith("getall")){
     String str = String("air|re_ga|");
     str += getAll();
     str += "|";
     str += clientId;
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     play(charBuf);
  }else if(mds[1].startsWith("setio")){
     int io = (int)mds[3].toInt();
     String str = String("air|setio|inputOK");
     if(io == 0){
        pinMode((int)mds[2].toInt(),INPUT);
     }else {
       pinMode((int)mds[2].toInt(),OUTPUT);
       str = String("air|setio|outputOK");
     }
     str += "|";
     str += clientId;
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     play(charBuf);
  }else if(mds[1].startsWith("sethl")){
     int hl = (int)mds[3].toInt();
     String str = String("air|sethl|lowOK");
     if(hl == 0){
        digitalWrite((int)mds[2].toInt(),LOW);
     }else {
       digitalWrite((int)mds[2].toInt(),HIGH);
       str = String("air|sethl|highOK");
     }
     str += "|";
     str += clientId;
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     play(charBuf);
  }else if(mds[1].startsWith("setpwm")){
    int pin = (int)mds[2].toInt();
    int val = (int)mds[3].toInt();
    analogWrite(pin,val);
    String str = String("air|setpwm|OK");
   str += "|";
   str += clientId;
   char charBuf[str.length()+1];
   str.toCharArray(charBuf, str.length()+1); 
   play(charBuf);
  }else if(mds[1].startsWith("setpos")){
    int pin = (int)mds[2].toInt();
    int pos = (int)mds[3].toInt();
    pinMode(pin,OUTPUT);
    servoToPot(pin,pos);
   String str = String("air|setpos|OK");
   str += "|";
   str += clientId;
   char charBuf[str.length()+1];
   str.toCharArray(charBuf, str.length()+1); 
   play(charBuf);
  }
  }else {
     //play("un kown");
  }
}

void servoToPot(int servopin,int myangle)
{
  for(int i=0;i<=50;i++){
  int pulsewidth=(myangle*11)+500;
  digitalWrite(servopin,HIGH);
  delayMicroseconds(pulsewidth);
  digitalWrite(servopin,LOW);
  delay(20-pulsewidth/1000);
  }
}

void spilt(int len)
{
 char charBuf[len+1];
 instr.toCharArray(charBuf,len+1);
 char* cmd = strtok(charBuf,"?");
 int ct=0;
 while(cmd !='\0'){
 mds[ct]=cmd;
 ct++;
 cmd= strtok('\0',"?");
 }
}

String getAll()
{
  String ios = String("");
  for(int i=0;i<=7;i++){
   ios += analogRead(i);
   if(i<=7-1){ios +=',';}else {ios +='|';}
  }
  for(int i=2;i<=9;i++){
    ios += digitalRead(i);
    if(i<=9-1){ios +=',';}
  }
  return ios;
}

String GetDht(int pin, int skin)
{
  int chk = 0;
  if(skin ==11){
  chk = DHT.read11(pin);
  }else if(skin ==21){
    chk = DHT.read21(pin);
  }else if(skin ==22){
    chk = DHT.read22(pin);
  }
  switch (chk)
  {
    case DHTLIB_OK:  
		//Serial.print("OK,\t"); 
		break;
    case DHTLIB_ERROR_CHECKSUM: 
		return "Checksum%error"; 
		break;
    case DHTLIB_ERROR_TIMEOUT: 
		return "Time out%error"; 
		break;
    default: 
		return "Unknown%error"; 
		break;
  }
   char buffer[10];
   String hum = dtostrf(DHT.humidity, 5, 2, buffer);
   String tem = dtostrf(DHT.temperature, 5, 2, buffer);
   String temp=hum+"%"+tem;
   return temp;
}
