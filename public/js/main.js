if (window.location.pathname == '/code') {
  $('#codeforces_form_alert').hide();
  $('#codeforces_form_alert2').hide();
}
$(document).ready(function() {
  if (window.location.pathname == '/code') {
    let errorForm = $('#codeforces_form_alert');
    let successForm = $('#codeforces_form_alert2');
    let codeforces_form_loader = $('#codeforces_form_loader');
    let codeforces_form = $('#codeforces_form');
    let username = document.getElementById('username_here');
    if (username) {
      username = username.innerText;
    }
    codeforces_form_loader.hide();
    errorForm.hide();
    successForm.hide();

    let autoSubmitForm = function() {
       let username = document.getElementById('username_here').innerText || '';
       console.log(username);
       if (username)
         codeforces_form.hide();
       document.getElementById('codeforces_username').value = username;
       //$('#codeforces_username').submit();
    }

    // Place JavaScript code here...
    $('#codeforces_form').submit(function(e) {
      // CALL api, like the cool guy
      username = document.getElementById('codeforces_username').value;
      queryLanguages();
      querySuggested();
      querySubmissionsType();
      queryTags();
      queryWeekDay();
      queryDaytime();

      codeforces_form_loader.show();
      codeforces_form.hide();
      errorForm.hide();
      //successForm.hide();
      console.log(username);
      //console.log(username.value);
      //let url = 'http://codeforces.com/api/user.status?handle=Fefer_Ivan&from=1&count=10'
      //let url = 'http://codeforces.com/api/user.status?handle='+username.value;
      let url = 'http://localhost:3000/codeforces_register';
      //let data = this.serialize();
      
      //$.post(url, {'username':username});
      $.ajax({
        type: 'POST',
        url,
        data: {
          'username': username,
        },
        //dataType: 'json',
        //encode: true,
        error: (msg) => {
          errorForm.show();
          console.log('ERROR: ', msg);
          codeforces_form_loader.hide();
          codeforces_form.show();
        },
        success: (data) => {
          $('#piechart_loader6').hide();
          if(data) {
            let codeforces_form_loader = $('#codeforces_form_loader');
            //successForm.show();
            codeforces_form.show();
            codeforces_form_loader.show();
            setTimeout(function() {
              console.log('WAITED FOR A MILLION YEARS');
              updateQuestionList();
            }, 3000);
          }
        }
      });
      e.preventDefault();
    });

    function updateRecommenedList(data) {
      $('#recommended_qs').text('');
      var content = "<thead><tr><th>S.No</th><th>Question Name</th></thead><tbody>"
        for(i=0; i<data.length; i++){
              //content += '<tr><td>' + i.toString() + '</td><td><a href="'+data[i].url+"'>"+data[i].name+'</a></td><hr></tr>';
              let c_id = data[i].question_id.substring(0,data[i].question_id.length-1)+'/'+data[i].question_id[data[i].question_id.length-1];
              //let c_id = "fuck"
              //console.log(data[i]);
              content += '<tr><td>' + (i+1).toString() + '</td>' + "<td><a target='_blank' href= 'http://codeforces.com/problemset/problem/" + c_id + "'>" + data[i].name + "</a></td></tr>";
              
        }
      content += "</tbody>"
      $('#recommended_qs').append(content);
      //let codeforces_form_loader = $('#codeforces_form_loader');
      //codeforces_form_loader.hide();
    }

    function updateQuestionList() {
      $('#piechart_loader6').show();
        let questionSolvedTable = $('#question_solved');
        let codeforces_form_loader = $('#codeforces_form_loader');


        $.ajax({
          type: 'GET',
          url: 'http://localhost:3000/codeforces_questions',
          //dataType: 'json',
          //encode: true,
          error: (msg) => {
            console.log('ERROR: ', msg);
          },
          success: (data) => {

            $('#question_solved').text('');
            var content = "<thead><tr><th>S.No</th><th>Question Name</th></thead><tbody>"
              for(i=0; i<data.length; i++){
                    //content += '<tr><td>' + i.toString() + '</td><td><a href="'+data[i].url+"'>"+data[i].name+'</a></td><hr></tr>';
                    content += '<tr><td>' + (i+1).toString() + '</td>' + "<td><a target='_blank' href= '" + data[i].url + "'>" + data[i].name + "</a></td></tr>";
                    
              }
            content += "</tbody>"

            $('#question_solved').append(content);
            let codeforces_form_loader = $('#codeforces_form_loader');
            codeforces_form_loader.hide();
            drawVizualizations();
            $('#piechart_loader6').hide();
          }
        });
    }
    updateQuestionList();

    function queryLanguages() {
      $('#piechart_loader2').show();
      $('#viz_pie2').hide();
      let url = 'http://localhost:3000/api/1.0/lang/'+username;
      //let url = 'http://codeforces.com/api/user.status?handle=Fefer_Ivan&from=1&count=10'
      console.log('URL', url);
      $.ajax({
        type: 'GET',
        url,
        //dataType: 'json',
        //encode: true,
        error: (msg) => {
          console.log('ERROR: ', msg);
        },
        success: (data) => {
          $('#piechart_loader2').hide();
          $('#viz_pie2').show();
          console.log(data);
          data = data.results;
          let names = []
          let counts = []
          for (let i=0; i<data.length; i++) {
            names.push(data[i].name);
            counts.push(data[i].count);
          }
          let viz_pie1 = document.getElementById('viz_pie2');
          drawPieViz(viz_pie1, names, counts);
        }
      });
    }
    queryLanguages();

    function queryWeekDay() {
      $('#piechart_loader3').show();
      $('#viz3').hide();
      let url = 'http://localhost:3000/api/1.0/weekday/'+username+'/OK';
      //let url = 'http://codeforces.com/api/user.status?handle=Fefer_Ivan&from=1&count=10'
      console.log('URL', url);
      $.ajax({
        type: 'GET',
        url,
        //dataType: 'json',
        //encode: true,
        error: (msg) => {
          console.log('ERROR: ', msg);
        },
        success: (data) => {
          $('#piechart_loader3').hide();
          $('#viz3').show();
          console.log(data);
          let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          let counts = data.count;
          let viz3 = document.getElementById('viz3');
          drawLineViz(viz3, days, counts);
        }
      });

      let viz3 = document.getElementById('viz3');
    }
    queryWeekDay();
    function queryDaytime() {
      $('#piechart_loader4').show();
      $('#viz4').hide();
      let url = 'http://localhost:3000/api/1.0/timeday/'+username+'/OK';
      //let url = 'http://codeforces.com/api/user.status?handle=Fefer_Ivan&from=1&count=10'
      console.log('URL', url);
      $.ajax({
        type: 'GET',
        url,
        //dataType: 'json',
        //encode: true,
        error: (msg) => {
          console.log('ERROR: ', msg);
        },
        success: (data) => {
          $('#piechart_loader4').hide();
          $('#viz4').show();
          console.log(data);
          let timezone = ['Morning', 'Noon', 'Evening', 'Night'];
          let counts = data.count;
          let viz3 = document.getElementById('viz4');
          drawLineViz(viz3, timezone, counts);
        }
      });
    }
    queryDaytime();
    function queryTags() {
      $('#piechart_loader').show();
      $('#viz_pie1').hide();
      let url = 'http://localhost:3000/api/1.0/tags/'+username+'/OK';
      console.log('URL', url);
      $.ajax({
        type: 'GET',
        url,
        error: (msg) => {
          console.log('ERROR: ', msg);
        },
        success: (data) => {
          $('#piechart_loader').hide();
          $('#viz_pie1').show();
          data = data.result;
          let names = []
          let counts = []
          for (let i=0; i<data.length; i++) {
            names.push(data[i].name);
            counts.push(data[i].count);
          }
          let viz_pie1 = document.getElementById('viz_pie1');
          drawPieViz(viz_pie1, names, counts);
        }
      });
    }
    queryTags();

      
    

    function querySuggested() {
      $('#piechart_loader5').show();
      $('#recommended_qs').hide();
      let url = 'http://localhost:3000/api/1.0/suggested_questions/'+username+'/CONTESTANT;PRACTICE;VIRTUAL/OK';
      console.log('URL', url);
      $.ajax({
        type: 'GET',
        url,
        //dataType: 'json',
        //encode: true,
        error: (msg) => {
          console.log('ERROR: ', msg);
          console.log('called from query suggested');
        },
        success: (data) => {
          $('#recommended_qs').show();
          $('#piechart_loader5').hide();
          data = data.results;
          count = data.length;
          let ques = [];
          for (let i = 0; i < 10; i++) {
            ques.push(data[i]);
          }
          //if (count < 100) {
            //for (let i = 0; i < count; i++) {
              //ques.push(data[i]);
            //}
          //}
          //else {
            //for (let i = count/2-50; i < count/2+50; i++) {
              //ques.push(data[i]);
            //}
          //}
          updateRecommenedList(ques);
        }
      });
    }
    querySuggested();
      
    function querySubmissionsType() {
      let username = document.getElementById('username_here').innerText;
      let url = 'http://localhost:3000/api/1.0/submission/'+username+'/CONTESTANT;PRACTICE;VIRTUAL/OK;';
    }
    querySubmissionsType();

    function drawVizualizations() { 
      let viz1 = document.getElementById('viz1');
      if (viz1) {
        Plotly.newPlot(viz1, [{x:[1,2],y:[1,2]}], { margin: {t: 0} } );
      }
    }

    function drawLineViz(dest, x_cor, y_cor) {
      Plotly.newPlot(dest, [{x:x_cor,y:y_cor}], { margin: {t: 0} } );
    }
    function drawLangViz(score) {
      let viz_pie1 = document.getElementById('viz_pie1');
      if (viz_pie1) {
        let data = [{
          values: [19, 34, 65],
          labels: ['Accepted', 'Wrong', 'None'],
          type: 'pie'
        }]
        Plotly.plot(viz_pie1, data);
      }
    }
    function drawPieViz(dest, names, counts) {
      let data = [{
        values: counts,
        labels: names,
        type: 'pie'
      }]
      Plotly.plot(dest, data);
    }
  }
});
