// Some general UI pack related JS
// Extend JS String with repeat method
String.prototype.repeat = function (num) {
  return new Array(num + 1).join(this);
};

(function ($) {

  // Add segments to a slider
  $.fn.addSliderSegments = function (amount, orientation) {
    return this.each(function () {
      if (orientation === 'vertical') {
        var output = '';
        var i;
        for (i = 1; i <= amount - 2; i++) {
          output += '<div class="ui-slider-segment" style="top:' + 100 / (amount - 1) * i + '%;"></div>';
        }
        $(this).prepend(output);
      } else {
        var segmentGap = 100 / (amount - 1) + '%';
        var segment = '<div class="ui-slider-segment" style="margin-left: ' + segmentGap + ';"></div>';
        $(this).prepend(segment.repeat(amount - 2));
      }
    });
  };

  $(function () {

    // Checkboxes and Radio buttons
    $('[data-toggle="checkbox"]').radiocheck();
    $('[data-toggle="radio"]').radiocheck();

    // Tooltips
    $('[data-toggle=tooltip]').tooltip('show');

    // jQuery UI Sliders
    var $slider = $('#slider');
    if ($slider.length > 0) {
      $slider.slider({
        min: 1,
        max: 5,
        value: 3,
        orientation: 'horizontal',
        range: 'min'
      }).addSliderSegments($slider.slider('option').max);
    }

    var $verticalSlider = $('#vertical-slider');
    if ($verticalSlider.length) {
      $verticalSlider.slider({
        min: 1,
        max: 5,
        value: 3,
        orientation: 'vertical',
        range: 'min'
      }).addSliderSegments($verticalSlider.slider('option').max, 'vertical');
    }

    // Switches
    if ($('[data-toggle="switch"]').length) {
      $('[data-toggle="switch"]').bootstrapSwitch();
    }
  });

})(jQuery);
