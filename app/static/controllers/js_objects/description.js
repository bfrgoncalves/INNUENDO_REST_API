

const loadGoogleChart = () => {
  // Load google charts
    google.charts.load('current', {'packages':['corechart']});

    // Draw the chart and set the chart values
    const drawChart = () => {
      const data = google.visualization.arrayToDataTable([
      ['Task', 'Hours per Day'],
      ['Work', 8],
      ['Friends', 2],
      ['Eat', 2],
      ['TV', 3],
      ['Gym', 2],
      ['Sleep', 7]
    ]);

    google.charts.setOnLoadCallback(drawChart);

    // Optional; add a title and set the width and height of the chart
    const options = {'title':'My Average Day', 'width':400, 'height':300};

    // Display the chart inside the <div> element with id="piechart"
    const chart = new google.visualization.PieChart(document.getElementById('piechart'));
    chart.draw(data, options);
    };
};