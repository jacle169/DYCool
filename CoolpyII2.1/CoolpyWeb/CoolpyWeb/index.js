$(document).ready(function () {
    var ws;

    function MyViewModel() {
        var self = this;



        //数模端口

        //温湿度操作
        self.rsPin = ko.observable("2");
        self.rd = ko.observable("温度(°C)：");
        self.sd = ko.observable("湿度(%)：");

        //登陆操作
        self.canLogin = ko.observable(true);
        self.ip = ko.observable("192.168.1.254");
        self.pwd = ko.observable("CoolpyII");

        // The current item will be passed as the first parameter, so we know which place was hovered over
        self.login = function (data, event) {
            try {
                if (window.WebSocket) {
                    loadingShow("连接中.....");
                    self.canLogin(false);
                    ws = new WebSocket("ws://" + self.ip() + ":88", self.pwd());
                    ws.onmessage = function (evt) {
                        if (evt.data == "Coolpy connected") {
                            debugClear();
                            debug("已成功连接到Coolpy");
                        } else if (evt.data.toString().substr(0, 6) == "re_rs|") {
                            var str = evt.data.toString().split("|");
                            var rs = str[1].split("%");
                            self.rd("温度(°C)：" + rs[1]);
                            self.sd("湿度(%)：" + rs[0]);
                        } else if (evt.data.toString().substr(0, 6) == "re_ga|") {
                            var str = evt.data.toString().split("|");
                            var ans = str[1].split(",");
                            var dis = str[2].split(",");

                            var size_an = ans.filter(function (value) { return value !== undefined }).length;
                            //模拟端口状态
                            for (var i = 0; i <= size_an; i++) {
                                $("#lb_a" + i).empty();
                                $("#lb_a" + i).append(("模拟信号端" + i + "：") + ans[i]);
                            }

                            var size_di = dis.filter(function (value) { return value !== undefined }).length;
                            //数字端口状态
                            for (var i = 0; i < size_di; i++) {
                                setDigital(i + 2, dis[i]);
                            }
                        }
                        sysDebug(evt.data);
                        if (evt.data.toString().substr(0, 4) == "air|") {
                            $("#dv_air_msg").empty();
                            $("#dv_air_msg").append("<p style='width:250px;word-wrap: break-word;'>" + evt.data + "</p>");
                        }
                    };
                    ws.onerror = function (evt) {
                        debugClear();
                        self.canLogin(true);
                        debug("错误:" + evt.data);
                    };
                    ws.onclose = function () {
                        loadingHide();
                        self.canLogin(true);
                        debug("Coolpy连接被断开");
                    };
                    ws.onopen = function () {
                        loadingHide();
                        sysDebugClear();
                        ws.send("Coolpy connected");
                    };
                } else { debug("此浏览器不支持Html5的通信技术"); }
            } catch (exception) {
                debug("此浏览器不支持Html5的通信技术");
            }
        };

        self.logout = function (data, event) {
            if (ws != null) {
                ws.close();
                ws = null;
            };
        };
        //温湿度截取dht11
        self.getdht11 = function (data, event) {
            var pin = self.rsPin();
            var cmd = "getrs,";
            cmd += pin + ",11";
            if (ws != null && ws.readyState == 1) {
                ws.send(cmd);
            } else {
                showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
            }
        };
        //温湿度截取dht21
        self.getdht21 = function (data, event) {
            var pin = self.rsPin();
            var cmd = "getrs,";
            cmd += pin + ",21";
            if (ws != null && ws.readyState == 1) {
                ws.send(cmd);
            } else {
                showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
            }
        };
        //温湿度截取dht22
        self.getdht22 = function (data, event) {
            var pin = self.rsPin();
            var cmd = "getrs,";
            cmd += pin + ",22";
            if (ws != null && ws.readyState == 1) {
                ws.send(cmd);
            } else {
                showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
            }
        };
        //数字端口GetAll
        self.getall = function (data, event) {
            if (ws != null && ws.readyState == 1) {
                ws.send("getall,0,0");
            } else {
                showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
            }
        }
    }
    ko.applyBindings(new MyViewModel());

    //清空消息
    $("#bt_sysDebug_clear").click(function () {
        sysDebugClear();
    });


    var lastSendTime;
    $("#tb_ir_codes").val("9000|4500|600|550|600|500|600|500|600|600|550|500|650|550|550|550|600|500|600|1650|600|1650|600|1650|600|1650|600|1650|550|1700|650|1600|650|1600|600|1650|650|500|600|550|550|550|600|500|600|550|600|500|650|500|550|600|600|1650|500|1700|650|1650|600|1650|500|1750|600|1650|600|1650|500");

    $("#lb_rxtx_sendMsg").keyup(function () {
        var limit = 32;
        var text = $(this).val();
        var chars = text.length;
        if (chars > limit) {
            var new_text = text.substr(0, limit);
            $(this).val(new_text);
        }
    });

    //IRlearn
    $("#bt_ir_send").click(function () {
        var codes = $("#tb_ir_codes").val().toString().split("|");
        var codeLen = codes.length;
        //var spcodes = codes.match(/.{50}|.+$/g);
        //var size_codes = spcodes.filter(function (value) { return value !== undefined }).length;
        if (ws != null && ws.readyState == 1) {
            for (var i = 0; i < codeLen; i++) {
                if (i == 0) {
                    //new
                    var cmd = "irsend0,";
                    cmd += codeLen + ",";
                    cmd += codes[i];
                    ws.send(cmd);
                } else if (i > 0 && i < codeLen - 1) {
                    //content
                    var cmd = "irsend1,";
                    cmd += codeLen + ",";
                    cmd += codes[i];
                    ws.send(cmd);
                } else if (i == codeLen - 1) {
                    //end
                    var cmd = "irsend2,";
                    cmd += codeLen + ",";
                    cmd += codes[i];
                    ws.send(cmd);
                }
            }
        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //setRxtxSend
    $("#bt_rxtx_send").click(function () {
        var msg = $("#lb_rxtx_sendMsg").val();
        if (msg.indexOf(",") == -1) {
            var cmd = "rxtxsend,";
            cmd += msg + ",0"
            if (ws != null && ws.readyState == 1) {
                ws.send(cmd);
                $("#dv_air_msg").empty();
            } else {
                showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
            }
        } else {
            showMsg("发送内容中不能使用逗号");
        }
    });

    //setRxtxOpen
    $("#bt_rxtx_setBaut").click(function () {
        var baut = $("#lb_rxtx_baut").val();
        var cmd = "setbaut,";
        cmd += baut + ",0"
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //setMotorPos
    $("#bt_mt_send").click(function () {
        var pin = $("#tb_mt_pin").val();
        var pos = $("#tb_mt_pos").val();
        var cmd = "setpos,";
        cmd += pin + "," + pos;
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //setMotorPinMode
    //$("#bt_set_mtpin").click(function () {
    //    var pin = $("#tb_mt_pin").val();
    //    var cmd = "setio,";
    //    cmd += pin + ",1";
    //    if (ws != null && ws.readyState == 1) {
    //        ws.send(cmd);
    //        //
    //    } else {
    //        showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
    //    }
    //});

    //setpmw
    $("#sd_pmw1").bind("change", function (event, ui) {
        var selection = $("#sd_pmw1").val();
        var cmd = "setpwm,";
        cmd += "3,";
        cmd += selection;
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_pmw2").bind("change", function (event, ui) {
        var selection = $("#sd_pmw2").val();
        var cmd = "setpwm,";
        cmd += "5,";
        cmd += selection;
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_pmw3").bind("change", function (event, ui) {
        var selection = $("#sd_pmw3").val();
        var cmd = "setpwm,";
        cmd += "6,";
        cmd += selection;
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_pmw4").bind("change", function (event, ui) {
        var selection = $("#sd_pmw4").val();
        var cmd = "setpwm,";
        cmd += "9,";
        cmd += selection;
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //setdigital
    $("#sd_hl_d2").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d2").val();
        var cmd = "sethl,";
        cmd += "2,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d3").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d3").val();
        var cmd = "sethl,";
        cmd += "3,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d4").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d4").val();
        var cmd = "sethl,";
        cmd += "4,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d5").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d5").val();
        var cmd = "sethl,";
        cmd += "5,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d6").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d6").val();
        var cmd = "sethl,";
        cmd += "6,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d7").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d7").val();
        var cmd = "sethl,";
        cmd += "7,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d8").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d8").val();
        var cmd = "sethl,";
        cmd += "8,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_hl_d9").bind("change", function (event, ui) {
        var selection = $("#sd_hl_d9").val();
        var cmd = "sethl,";
        cmd += "9,";
        cmd += selection == "Off" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //setpinmode
    $("#sd_io_d2").bind("change", function (event, ui) {
        var selection = $("#sd_io_d2").val();
        var cmd = "setio,";
        cmd += "2,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d3").bind("change", function (event, ui) {
        var selection = $("#sd_io_d3").val();
        var cmd = "setio,";
        cmd += "3,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d4").bind("change", function (event, ui) {
        var selection = $("#sd_io_d4").val();
        var cmd = "setio,";
        cmd += "4,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d5").bind("change", function (event, ui) {
        var selection = $("#sd_io_d5").val();
        var cmd = "setio,";
        cmd += "5,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d6").bind("change", function (event, ui) {
        var selection = $("#sd_io_d6").val();
        var cmd = "setio,";
        cmd += "6,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d7").bind("change", function (event, ui) {
        var selection = $("#sd_io_d7").val();
        var cmd = "setio,";
        cmd += "7,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d8").bind("change", function (event, ui) {
        var selection = $("#sd_io_d8").val();
        var cmd = "setio,";
        cmd += "8,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    $("#sd_io_d9").bind("change", function (event, ui) {
        var selection = $("#sd_io_d9").val();
        var cmd = "setio,";
        cmd += "9,";
        cmd += selection == "In" ? "0" : "1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //模拟端口GetAll
    $("#bt_analog_getall").click(function () {
        if (ws != null && ws.readyState == 1) {
            ws.send("getall,0,0");

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });



    

});

function setDigital(pin, st) {
    if (parseInt(st) == 0) {
        $('#sd_hl_d' + pin).val('Off').slider("refresh");
    } else {
        $('#sd_hl_d' + pin).val('On').slider("refresh");
    }
}

function loadingShow(msg) {
    $.mobile.loading('show', {
        text: msg,
        textVisible: true,
        theme: 'e',
        html: ""
    });
}

function loadingHide() {
    $.mobile.loading('hide');
}

function debug(str) {
    $("#debug").append("<p>" + str + "</p>");
}

function debugClear() {
    $("#debug").empty();
}

function sysDebug(str) {
    $("#div_sysMsg").append("<p style='width:250px;word-wrap: break-word;'>" + str + "</p>");
}

function sysDebugClear() {
    $("#div_sysMsg").empty();
}

function showMsg(msg) {
    $("#lb_msg").empty();
    $("#lb_msg").append(msg);
    $("#po_msg").popup("open");
}