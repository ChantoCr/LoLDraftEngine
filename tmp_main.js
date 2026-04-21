var clipboard = new Clipboard('.copy-target');

$("#copy-target").click(function (e) {
    e.preventDefault()
    $(this).html("Profile link copied to clipboard!")
})

//When creating a new policy- this function helps manages the API options that will be saved.
$(document).ready(function() {
  $('#add').click(function() {
    var option = $('#id_all_policies option:selected').sort().clone();
    $('#policies').append(option);
  });
  $('#remove').click(function() {
    return !$('#policies option:selected').remove();
  });
  $('#submit_policy').click(function() {
    $('#id_transfer_policy option').prop('selected', true);
    $('#id_transfer_policy option:selected').remove();

    $('#policies option').prop('selected', true);
    var option = $('#policies option:selected').sort().clone();
    $('#policies option').prop('selected', false);
    $('#id_transfer_policy').append(option);
    $('#id_transfer_policy option').prop('selected', true);

  });
});
//The Next Batch of apps have to do with maintaining that the page is active when it is clicked and on the same page.
//App Details
$(document).ready(function () {
    var loc = window.location.href;
    $(".list-messages a").each(function() {
        if (loc.indexOf($(this).attr("href")) != -1) {
            $(this).parents().eq(2).addClass("list-group-messages-current");
        }
    });
});
//Messages
$(document).ready(function () {
    var loc = window.location.href;
    $(".app-nav-bar a").each(function() {
        if (loc.indexOf($(this).attr("href")) != -1) {
            $(this).parent().addClass("active");
        }
    });
});
//Admin Side Bar
$(document).ready(function () {
    var loc = window.location.href;
    $(".site-menu a").each(function() {
        if (loc.indexOf($(this).attr("href")) != -1) {
            $(this).parent().addClass("active-on");
            if ($(this).hasClass('sub-item')){
             $(this).parents().eq(2).addClass("menu-active");
           }
        }
    });
});


$('site-menu .site-menu-item.menu-active > .site-menu-sub').click(function() {
  $(this).parent().find('ul').toggle();
})

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('[fallback] Could not copy text: ', err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
  }, function(err) {
    console.error('[async] Could not copy text: ', err);
  });
}


/* 
Agreeing to a policy via the "register project" flow
*/
var selected_app_type = ""

$(".select_app_type").click(function () {
    selected_app_type = $(this).attr("app_type")
})

$(".policy_agreement").click(function (e) {
    if (selected_app_type){
        window.location = "/terms-general/?type=" + selected_app_type
        e.preventDefault()
    }
    else {
        alert("You did not select a valid application type.")
    }
});