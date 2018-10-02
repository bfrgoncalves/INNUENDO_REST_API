

const humanFileSize = (bytes, si) => {
    let thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    let units = si
        ? ["kB","MB","GB","TB","PB","EB","ZB","YB"]
        : ["KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
};


const loadGoogleChart = (t_quota) => {

    $("#piechart_quota").empty();
    $("#piechart_user").empty();

    Highcharts.chart("piechart_quota", {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie"
        },
        title: {
            text: "Available Quota for the Institution"
        },
        tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                    enabled: true,
                    format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || "black"
                    }
                }
            }
        },
        series: [{
            name: "Space",
            colorByPoint: true,
            data: [{
                name: "Free Space",
                y: t_quota.t_quota - t_quota.f_quota
            }, {
                name: "Used Quota",
                y: t_quota.f_quota,
                sliced: true,
                selected: true
            }]
        }]
    });

    Highcharts.chart("piechart_user", {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie"
        },
        title: {
            text: "Projects Space"
        },
        tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                    enabled: true,
                    format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || "black"
                    }
                }
            }
        },
        series: [{
            name: "Space",
            colorByPoint: true,
            data: [{
                name: "Free Space",
                y: t_quota.t_quota - (t_quota.p_space + t_quota.u_space)
            },{
                name: "Other Projects Space",
                y: t_quota.f_quota - t_quota.p_space
            }, {
                name: "User Project",
                y: t_quota.p_space,
                sliced: true,
                selected: true
            }]
        }]
    });
};