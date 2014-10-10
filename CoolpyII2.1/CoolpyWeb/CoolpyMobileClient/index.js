$(document).ready(function () {
    var viewModel = kendo.observable({
        ip: "192.168.1.254", pwd: "CoolpyII",
        login: function() {
            var ip = this.get("ip");
            alert("Hello, " + name + "!!!");
        }
});

    kendo.bind($("#drawer-home"), viewModel);

});