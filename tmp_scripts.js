// Basic Forms that are now customized for drop downs
$(function() {
  $(".form-chosen").chosen({
    width: "100%",
    disable_search: true,
  });
});

//Highlight on scrollTop
$('#side-bar li').on("click", function(event) {
    $('#side-bar li').removeClass('active');
    $(this).addClass('active');
});


//Side Menu for admin to make the menu expand on click.
$('.side-menu-cms').on("click", function(event){
  $('.side-menu-cms').removeClass('active');
  if($(this).hasClass("menu-active")) {
    $(this).removeClass('menu-active');
  } else {
    $(this).addClass('menu-active');
  }
});

//ON HOVER ADD OPEN FOR TOP MENU
  $('.hover-dropdown').hover (
    function(){
      $( this ).addClass('open');
    }, function() {
      $( this ).removeClass('open');
    }
  );




  //Remove Required so Django will deal with Empty Fields and not the Browser
  $(document).ready(function() {
    $(".form-control").each(function() {
      if (typeof $(this).attr("required") !== undefined) {
        $(this).removeAttr("required");
      }
    });

    //Set API Reference Page side bar height
    var na = $(".api-ref-sidebar .scrollable-container").height();
    $(".api-ref-sidebar").css('min-height', na + 200);
    $(".api-ref-mainview .padding-left-300").css('min-height', na + 130);

    //CUSTOM CONFIRM BOX
    $('#confirm-action').on("click", function(event){
      var bgfade = "<div class ='confirm-background'></div>";
      var confirmbox = "<div class = 'confirm-box'><div class = 'confirm-header' ><p>Are You Sure?</p></div><button type='submit' class = 'btn btn-riot btn-riotred btn-a confirm-button confirm-button-left' name='confirm_action'>Yes</button><button id='remove-confirm' class = 'btn btn-riot btn-a confirm-button'>No</button></div>";
      $('.form-target').append(bgfade, confirmbox);
    });

    //CUSTOM CONFIRM BOX
    $('#tournament-action').on("click", function(event){
      var bgfade = "<div class ='confirm-background'></div>";
      var confirmbox = "<div class = 'confirm-box-tournament'>\
        <div class = 'confirm-header' >\
        <p>Are You Sure?</p>\
        <p>Regenerating your API key will break your current tournaments associated with the key.</p>\
        </div>\
        <button type='submit' class = 'btn btn-riot btn-riotred btn-a confirm-button confirm-button-left' name='confirm_action'>Yes</button>\
        <button id='remove-confirm' class = 'btn btn-riot btn-a confirm-button'>No</button>\
        </div>";
      $('.form-target').append(bgfade, confirmbox);
    });

    $('#confirm-delete').on("click", function(event){
      var bgfade = "<div class ='confirm-background'></div>";
      var confirmbox = "<div class = 'confirm-box'><div class = 'confirm-header' ><p>Are You Sure?</p></div><button type='submit' class = 'btn btn-riot btn-riotred btn-a confirm-button confirm-button-left' name='confirm_delete'>Yes</button><button id='remove-confirm' class = 'btn btn-riot btn-a confirm-button'>No</button></div>";
      $('.form-target').append(bgfade, confirmbox);
    });

    $('body').on("click","#remove-confirm", function(event){
      $('.confirm-background').remove();
      $('.confirm-box').remove();
      $('.confirm-header').remove();
      $('.confirm-button').remove();
    });

  });

//Select all for batch tool on Admin App list Page
$("#select_all").click(function(){
  $('.select_apps').not(this).prop('checked', this.checked);
});
//Admin App will hide Modify Selected When nothing is selected.

$(".select_apps").on("click", function(){
  var check = 0
  $(".select_apps").each(function(){
    if($(this).prop('checked') == true){
      $("#modify_selected").show();
      check = check + 1;
    }
  });
  if(check == 0){
    $("#modify_selected").hide()
  };
  check = 0;
});

$(".status_close").click(function (e) {
    $(".status_bar").slideUp("fast");
    e.preventDefault();
});
