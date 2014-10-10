$(document).ready(function () {
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

    var ws;
    //登录
    $("#bt_login").click(function () {
        try {
            if (window.WebSocket) {
                loadingShow("连接中.....");
                document.getElementById("bt_login").disabled = true;
                var address = $('#tb_address').val();
                var pwd = $('#tb_pwd').val();
                ws = new WebSocket("ws://" + address + ":88", pwd);
                ws.onmessage = function (evt) {
                    if (evt.data == "Coolpy connected") {
                        debugClear();
                        debug("已成功连接到Coolpy");
                    } else if (evt.data.toString().substr(0, 6) == "re_rs|") {
                        var str = evt.data.toString().split("|");
                        var rs = str[1].split("%");
                        $("#lb_rd").empty();
                        $("#lb_rd").append("温度(°C)：" + rs[1]);
                        $("#lb_sd").empty();
                        $("#lb_sd").append("湿度(%)：" + rs[0]);
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
                };
                ws.onerror = function (evt) {
                    debugClear();
                    document.getElementById("bt_login").disabled = false;
                    debug("错误:" + evt.data);
                };
                ws.onclose = function () {
                    loadingHide();
                    document.getElementById("bt_login").disabled = false;
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
    $("#bt_set_mtpin").click(function () {
        var pin = $("#tb_mt_pin").val();
        var cmd = "setio,";
        cmd += pin + ",1";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);
            //
        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

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

    //数字端口GetAll
    $("#bt_digital_getall").click(function () {
        if (ws != null && ws.readyState == 1) {
            ws.send("getall,0,0");

        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //温湿度截取dht22
    $("#bt_get_rs22").click(function () {
        var pin = $("#tb_rd_pin").val();
        var cmd = "getrs,";
        cmd += pin + ",22";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);
        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //温湿度截取dht21
    $("#bt_get_rs21").click(function () {
        var pin = $("#tb_rd_pin").val();
        var cmd = "getrs,";
        cmd += pin + ",21";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);
        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //温湿度截取dht11
    $("#bt_get_rs").click(function () {
        var pin = $("#tb_rd_pin").val();
        var cmd = "getrs,";
        cmd += pin + ",11";
        if (ws != null && ws.readyState == 1) {
            ws.send(cmd);
        } else {
            showMsg("与Coolpy的连接出现问题，请重新连接Coolpy设备");
        }
    });

    //清空消息
    $("#bt_sysDebug_clear").click(function () {
        sysDebugClear();
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