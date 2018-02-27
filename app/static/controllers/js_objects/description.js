

const loadGoogleChart = (t_quota) => {

    $("#piechart_quota").empty();
    $("#piechart_user").empty();

    Highcharts.chart('piechart_quota', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Available Quota for the Institution'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        series: [{
            name: 'Space',
            colorByPoint: true,
            data: [{
                name: 'Free Space',
                y: t_quota.f_quota
            }, {
                name: 'Used Quota',
                y: t_quota.t_quota - t_quota.f_quota,
                sliced: true,
                selected: true
            }]
        }]
    });


    Highcharts.chart('piechart_user', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Projects Space'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        series: [{
            name: 'Space',
            colorByPoint: true,
            data: [{
                name: 'Free Space',
                y: t_quota.t_quota - (t_quota.p_space + t_quota.u_space)
            },{
                name: 'Other Projects Space',
                y: (t_quota.u_space + t_quota.i_quota) - t_quota.p_space
            }, {
                name: 'User Projects',
                y: t_quota.u_space,
                sliced: true,
                selected: true
            }]
        }]
    });
};