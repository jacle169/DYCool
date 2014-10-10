#include <Arduino.h> // Arduino 1.0 or greater is required
#include <stdlib.h>

#include <SPI.h>
#include <Ethernet.h>

#ifndef WEBSOCKET_H_
#define WEBSOCKET_H_

//// Enabe debug tracing to Serial port.
//#define DEBUG

// CRLF characters to terminate lines/handshakes in headers.
#define CRLF "\r\n"

class WebSocket {
public:
    // Constructor.
    WebSocket(const char *urlPrefix = "/", int inPort = 88);
    
    // Callback functions definition.
    typedef void DataCallback(WebSocket &socket, char* socketString, byte frameLength);
    typedef void Callback(WebSocket &socket);
	typedef int AuthCallback(char* socketString, byte frameLength);
    
    // Start tlistening for connections.
    void begin();
    
    // Main listener for incoming data. Should be called from the loop.
    void listen();

	void doGetFrame();

	    //close connection
    void disconnect();
   
    // Callbacks
    void registerDataCallback(DataCallback *callback);
    void registerConnectCallback(Callback *callback);
    void registerDisconnectCallback(Callback *callback);
    int registerAuthCallback(AuthCallback *callback);
    
	// Are we connected?
	bool isConnected();

    // Embeds data in frame and sends to client.
    bool send(char *str, byte length);

private:
    EthernetServer server;
    EthernetClient client;
    enum State {DISCONNECTED, CONNECTED} state;

    const char *socket_urlPrefix;

    // Pointer to the callback function the user should provide
    DataCallback *onData;
    Callback *onConnect;
    Callback *onDisconnect;
	AuthCallback *onAuth;

    // Discovers if the client's header is requesting an upgrade to a
    // websocket connection.
    bool doHandshake();
    
    // Reads a frame from client. Returns false if user disconnects, 
    // or unhandled frame is received. Server must then disconnect, or an error occurs.
    bool getFrame();

    // Disconnect user gracefully.
    void disconnectStream();


};

#endif