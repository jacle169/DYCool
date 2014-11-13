#include <SPI.h>
#include <Ethernet.h>
#define MAX_FRAME_LENGTH 64
#include <WebSocket.h>
#include <dht.h>
dht DHT;

// Enabe debug tracing to Serial port.
//#define DEBUG

byte mac[6];
byte ip[4];
WebSocket wsServer;
String mds[3];
String instr;
boolean opened=false;
boolean acced=false;

void setup() {   
  Serial.begin(9600);
  
mac[0]=random(1, 254);
mac[1]=random(1, 254);
mac[2]=random(1, 254);
mac[3]=random(1, 254);
mac[4]=random(1, 254);
mac[5]=random(1, 254);
if (Ethernet.begin(mac) == 0) {
  for(;;)
    ;
}
ip[0]= Ethernet.localIP()[0];
ip[1]= Ethernet.localIP()[1];
ip[2]= Ethernet.localIP()[2];
ip[3]= 254;
Ethernet.begin(mac, ip);  
wsServer.registerConnectCallback(&onConnect);
wsServer.registerDataCallback(&onData);
wsServer.registerDisconnectCallback(&onDisconnect);  
wsServer.registerAuthCallback(&onAuth);
wsServer.begin();
delay(200); // Give Ethernet time to get ready
opened=true;
#ifdef DEBUG  
  Serial.println("Coolpy rinning");
#endif
}

char inData[100]; // Allocate some space for the string
char inChar=-1; // Where to store the character read
byte index = 0; // Index into array; where to store the character

int rf=0;
void loop() {
  if(!acced){
   rf=0;
   wsServer.listen();
  }else{
    if(rf >= 400*50){
     rf =0;
     wsServer.send("refresh", 7);
     if(!wsServer.isConnected()){
      wsServer.disconnect();
     }
    }
    wsServer.doGetFrame(); 
    ////serial connection
    if(Serial.available()){
      inChar = Serial.read(); // Read a character
      if(inChar =='@'){
        index=0;
      }else if(inChar == '~'){
         Serial.print(inData);
          wsServer.send(inData, index);
          rf=0;
      }else{
      inData[index] = inChar; // Store it
      index++; // Increment where to write next
      inData[index] = '\0'; // Null terminate the string
      }
    }  
  }
  delay(1);
  rf++;
}

void onConnect(WebSocket &socket) {
  acced=true;
}

void onDisconnect(WebSocket &socket) {
  acced=false;
  
  #ifdef DEBUG  
  Serial.println("Coolpy DisConnected");
  Serial.println(acced?"true":"false");
  #endif
}

int onAuth(char* dataString, byte frameLength) {
  char pwd[] = "CoolpyII";
  if (strcmp(pwd, dataString)  != 0)  // test to see if the two strings are equal
    { 
       return 0; 
    } 
   return 1;
}

void onData(WebSocket &socket, char* dataString, byte frameLength) {
  //socket.send(dataString, strlen(dataString));
  //socket.send(dataString,frameLength);
  instr = String(dataString);
  if(instr.startsWith("getrs")){
    spilt(frameLength);
    int pin = (int)mds[1].toInt();
    int skin = (int)mds[2].toInt();
     String str = String("re_rs|");
     str += GetDht(pin,skin);
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     socket.send(charBuf,str.length()+1);
  }else if(instr.startsWith("getall")){
     String str = String("re_ga|");
     str += getAll();
     char charBuf[str.length()+1];
     str.toCharArray(charBuf, str.length()+1); 
     socket.send(charBuf,str.length()+1);
  }else if(instr.startsWith("setio")){
     spilt(frameLength);
     int io = (int)mds[2].toInt();
     if(io == 0){
        pinMode((int)mds[1].toInt(),INPUT);
        socket.send("re_setInput_ok",14);
     }else {
       pinMode((int)mds[1].toInt(),OUTPUT);
        socket.send("re_setOutput_ok",15);
     }
  }else if(instr.startsWith("sethl")){
     spilt(frameLength);
     int hl = (int)mds[2].toInt();
     if(hl == 0){
        digitalWrite((int)mds[1].toInt(),LOW);
        socket.send("re_setLow_ok",12);
     }else {
       digitalWrite((int)mds[1].toInt(),HIGH);
        socket.send("re_setHigh_ok",14);
     }
  }else if(instr.startsWith("setpwm")){
    spilt(frameLength);
    int pin = (int)mds[1].toInt();
    int val = (int)mds[2].toInt();
    analogWrite(pin,val);
    socket.send("re_setPmw_ok",12);
  }else if(instr.startsWith("setpos")){
    spilt(frameLength);
    int pin = (int)mds[1].toInt();
    int pos = (int)mds[2].toInt();
    pinMode(pin,OUTPUT);
    servoToPot(pin,pos);
    socket.send("re_setPos_ok",12);
  }else if(instr.startsWith("setbaut")){
    spilt(frameLength);
    int baut = (int)mds[1].toInt();
    if(opened){
      Serial.begin(baut);
      socket.send("re_setRxtxOpen_ok",17);
    }else{
      socket.send("re_RxtxOpen_Err",15);
    }
  }else if(instr.startsWith("rxtxsend")){
    spilt(frameLength);
    if(opened){
      Serial.print('@');
      Serial.print(mds[1]);  
      Serial.print('~'); 
      socket.send("re_setRxtxSend_ok",17);
    }else{
      socket.send("re_RxtxSend_Err",15);
    }
  }else {
     socket.send(dataString,frameLength);
  }
  rf=0;
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
 char* cmd = strtok(charBuf,",");
 int ct=0;
 while(cmd !='\0'){
 mds[ct]=cmd;
 ct++;
 cmd= strtok('\0',",");
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
