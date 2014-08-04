/** 
 * This is the description of the HelloWorld component. Here you can set any HTML text 
 * for putting on the generated documentation.
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * @version 1.0.0
 * @category 1
 * 
 * @requires <a href='http://code.jquery.com/jquery-1.6.4.js'>jQuery Core 1.6.4</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.6.4.min.js"></script>
 * 
 * @param {Object} options An object with the options for BAMRegionList component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 *    
 * @option {string} [fontFamily='"Andale mono", courier, monospace'] 
 *    Font list to be applied to the component content.
 *  
 * @option {string} [fontColor="white"] 
 *    HTML color code for the font.
 *    
 * @option {string} [backgroundColor="#7BBFE9"] 
 * 	  Background color for the entire div content.
 * 
 * @option {Object} [selectionFontColor="white"] 
 * 	  This color will be used to change the font color of selected text.
 * 
 * @option {Object} [ selectionBackgroundColor="yellow"] 
 * 	  This color will be used to change the background of selected text.
 *     
 * @example 
 * var instance = new Biojs.BAMRegionList({
 * 		target : "YourOwnDivId",
 * 		selectionBackgroundColor : '#99FF00'
 *		list: "../../main/resources/data/BAMViewerChrList.txt"
 * });	
 * 
 */
Biojs.BAMRegionSelector = Biojs.extend (
/** @lends Biojs.HelloWorld# */
{
  constructor: function (options) {
	  // In JavaScript ÒthisÓ always refers to the ÒownerÓ of the function we're executing (http://www.quirksmode.org/js/this.html)
	  // Let's preserve the reference to 'this' through the variable self. In this way, we can invoke/execute 
	  // our component instead of the object where 'this' is being invoked/executed.
	  var self = this;
    
	  // For practical use, create an object with the main DIV container 
	  // to be used in all of the code of our component
	  this._container = jQuery("#"+self.opt.target);
	  
	  // Apply options values
	  this._container.css({
		  'font-family': self.opt.fontFamily, // this is one example of the use of self instead of this
		  'background-color': self.opt.backgroundColor,
		  'color': self.opt.fontColor	  
	  });
	

	  //list of functions to calback on selection change. 
	  this.callbacks = [];
    this.center_callbacks = [];
	  // Set the content

	  this._container.empty()
	  this._container.append('<span>Loading...</span>');
	  this._container.BAMRegionSelector = self;
	  this._render_scroll();


  },

  /**
   *  Default values for the options
   *  @name Biojs.HelloWorld-opt
   */
  opt: {
     target: "YourOwnDivId",
     fontFamily: '"Andale mono", courier, monospace',
     fontColor: "black",
     backgroundColor: "white",
     selectionFontColor: "blak",
     selectionBackgroundColor: "gray",
     width: "80%",
     height: "100px"
  },
  
  /**
   * Array containing the supported event names
   * @name Biojs.HelloWorld-eventTypes
   */
  eventTypes : [
	/**
	 * @name Biojs.HelloWorld#onClick
	 * @event
	 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	 * @eventData {Object} source The component which did triggered the event.
	 * @eventData {string} type The name of the event.
	 * @eventData {int} selected Selected character.
	 * @example 
	 * instance.onClick(
	 *    function( objEvent ) {
	 *       alert("The character " + objEvent.selected + " was clicked.");
	 *    }
	 * ); 
	 * 
	 * */
	 "onClick",
	 
  
  ], 
  
  
  
  parse_list: function (data){
  	//TODO: parse the lines and make sure they are actual regions. 
  	return   data.split("\n"); 
  },
  

  add_region_callback: function(component){
  	this.callbacks.push(component)
  },

  _region_click: function(region){
  	arrayLength= this.callbacks.length;
  	for (var i = 0; i < arrayLength; i++) {
  		this.callbacks[i].setRegion(region);
  	}
  },

  setRegion: function(region){
    console.log("RegionSelector region: " + region);
    var reg = parse_bam_region(region);
    //var slider_div  = jQuery("#"+this.slider_id);
    //console.log(JSON.stringify(reg));
    this.slider_div.slider( "option", "min", reg.start);
    this.slider_div.slider( "option","max", reg.end);
    this.slider_div.slider( "option","value", reg.start);
  },

  setSelectedRegion: function(region){
    var reg = parse_bam_region(region);
    var middle = reg.middle();
    var old_middle = this.position_value.val();

    console.log("Selecting region middles form: " + middle + " to " + old_middle);
    this.position_value.val(middle);
    this.slider_div.slider("value", middle);
    if(middle != old_middle){
      this.center();  
    }
    
  }
  ,

  center: function(){
     var val = this.position_value.val();
     for (var i = this.center_callbacks.length - 1; i >= 0; i--) {
       this.center_callbacks[i].set_central_base(val);
     }
  },

  add_center_callback: function(component){
    this.center_callbacks.push(component);

  },

  _render_scroll: function(){
    this.slider_id =  this.opt.target + "_slider";
    this.slider_pos = this.opt.target + "_position";
    self = this;
    var blank_html = "\
    <p>\
    <label for=\"" + this.slider_pos + "\">Centered in:</label>\
    <input type=\"text\" id=\"" + this.slider_pos + "\" style=\"border:0; color:#f6931f; font-weight:bold;\">  \
    <div id=\"" + this.slider_id + "\" style=width:"+this.opt.width+";height:20px\"></div> </p>";
    this._container.html(blank_html)  ;
    var sp =  this.slider_pos;
    console.log("Using widht: " + this.opt.width);
    this.slider_div  = jQuery("#"+this.slider_id)

    this.slider_div.slider({
      orientation: "horizontal",
      min: 0,
      max: 100,
      value: 60,
      slide: function( event, ui ) {
        pos_div = jQuery( "#" + sp);
        pos_div.val( ui.value );
      }, 
      stop: function(event, ui){
        self.center();
      }
    });
    this.position_value = $( "#" + this.slider_pos );
    this.position_value.val( $( "#" + this.slider_id ).slider( "value" ) );
    this.position_value.change(function() {
      self.slider_div.slider( "value", this.value);
      self.center();
    });
    this.position_value.keypress(function( event ) {
      if(event.keycode == "13"){
        self.slider_div.slider( "value", this.value);
        self.center();
      }
    });
  }
  
});







