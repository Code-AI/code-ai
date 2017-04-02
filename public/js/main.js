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
    console.log('boo boo boo');
    $('#codeforces_form').submit(function(e) {
      // CALL api, like the cool guy
      queryLanguages();
      querySuggested();
      querySubmissionsType();

      codeforces_form_loader.show();
      codeforces_form.hide();
      errorForm.hide();
      //successForm.hide();
      let username = document.getElementById('codeforces_username').value;
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
          let codeforces_form_loader = $('#codeforces_form_loader');
          successForm.show();
          codeforces_form_loader.show();
          setTimeout(function() {
            console.log('WAITED FOR A MILLION YEARS');
            updateQuestionList();
          }, 5000);
        }
      });
      e.preventDefault();
    });

    function updateQuestionList() {
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
          }
        });
    }
    updateQuestionList();

    function queryLanguages() {
      let url = 'http://192.168.43.18:5000/api/1.0/lang/'+username;
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
          console.log(data[0].name)
        }
      });
    }
    queryLanguages();


    function queryTags() {
      let url = 'http://192.168.43.18:5000/api/1.0/tags/'+username+'/OK';
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
          console.log(data);
          score = 0;
          drawPieViz(score);
        }
      });
    }
    queryTags();

      
    

    function querySuggested() {
      let username = document.getElementById('username_here').innerText;
      let url = 'http://192.168.43.18:5000/api/1.0/suggested_questions/'+username+'/CONTESTANT;PRACTICE;VIRTUAL/OK';
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
          console.log(data);
          data = data.results;
          console.log(data[0].name)
        }
      });
    }
    querySuggested();
      
    function querySubmissionsType() {
      let username = document.getElementById('username_here').innerText;
      let url = 'http://192.168.43.18:5000/api/1.0/submission/'+username+'/CONTESTANT;PRACTICE;VIRTUAL/OK;';
    }
    querySubmissionsType();

    function drawVizualizations() { 
      let viz1 = document.getElementById('viz1');
      if (viz1) {
        Plotly.plot(viz1, [{x:[1,2],y:[1,2]}], { margin: {t: 0} } );
      }
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
