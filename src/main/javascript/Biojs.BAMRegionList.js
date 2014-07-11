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
Biojs.BAMRegionList = Biojs.extend (
/** @lends Biojs.HelloWorld# */
{
  constructor: function (options) {
	  // In JavaScript ÒthisÓ always refers to the ÒownerÓ of the function we're executing (http://www.quirksmode.org/js/this.html)
	  // Let's preserve the reference to 'this' through the variable self. In this way, we can invoke/execute 
	  // our component instead of the object where 'this' is being invoked/executed.
	  var self = this;
      this.dataSet = options.dataSet;
	  this.reference = options.reference;
	  

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

	  // Set the content

	  this._container.empty()
	  this._container.append('<span>Loading...</span>');
	  this._container.BAMRegionList = self;
	  this.load_list();


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
     selectionBackgroundColor: "gray"
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

  load_list: function(){
    //alert(self.dataSet);

    //alert(this.dataSet);
    reference = this.reference;
  
  //http://localhost:4567/region?bam=testu&region=chr_1:1-400&ref=test_chr.fasta 
    jQuery.ajax({
                type: "GET",
                url: this.dataSet,
                data: { bam: this.bam , ref: this.reference } ,
                dataType: "text",
                container: this,
                success: function (data) {
                    correct = true
                    regions = this.container.parse_list(data);
                    if(regions){
                      cont = jQuery("#"+this.container.opt.target);
                      cont.empty();
                      
                      var arrayLength = regions.length;
						for (var i = 0; i < arrayLength; i++) {
							var element = document.createElement("div");
							element.region = regions[i] 
							var newContent = document.createTextNode(regions[i]); 
							element.id = this.container.opt.target + "_div_" + regions[i];
  							element.bam_list = this.container
  							element.appendChild(newContent);
							element.onclick = function(evnt){
								target=evnt.currentTarget;
								list_node=target.parentNode;
								local_container = target.bam_list
								if ('undefined' !== typeof list_node.selected_node) {
									list_node.selected_node.style.backgroundColor=local_container.opt.backgroundColor;
								}
								list_node.selected_node=target;
								local_container._region_click(target.region);
								target.style.backgroundColor = local_container.opt.selectionBackgroundColor;
							};

							cont.append(element);
						}
                    } else {
                        alert("Unknown format detected")
                    }

                },
                error: function (qXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
  }
  
});






