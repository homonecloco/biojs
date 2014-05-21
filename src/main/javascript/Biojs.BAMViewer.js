/** 
 * This is the description of the BAMViewer component. Here you can set any HTML text 
 * for putting on the generated documentation.
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:ricardo.ramirez-gonzalez@tgac.ac.uk">Ricardo H. Ramirez-Gonzalez</a>
 * @version 1.0.0
 * @category 1
 * 
 * @requires <a href='http://code.jquery.com/jquery-1.6.4.js'>jQuery Core 1.6.4</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.6.4.min.js"></script>
 * 
 * requieres <a >
 * 
 * @param {Object} options An object with the options for BAMViewer component.
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
 *    Background color for the entire div content.
 * 
 * @option {Object} [selectionFontColor="white"] 
 *    This color will be used to change the font color of selected text.
 * 
 * @option {Object} [ selectionBackgroundColor="yellow"] 
 *    This color will be used to change the background of selected text.
 *     
 * @example 
 * var instance = new Biojs.BAMViewer({
 *    target : "YourOwnDivId",
 *    selectionBackgroundColor : '#99FF00'
 * });  
 * 
 */
Biojs.BAMViewer = Biojs.extend (
/** @lends Biojs.BAMViewer# */
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
      'color': self.opt.fontColor,
      'font-size': '36px',
      'text-align': 'center',
      'vertical-align':'middle',
      'display': 'table-cell',
      'width': '597px',
      'height': '300px'     
    });
  
    // Disable text selection and
    // Change the selection mouse pointer  
    // from text to hand.
    this._container.css({
      '-moz-user-select':'none',
      '-webkit-user-select':'none',
      'user-select':'none'
    });

    // Set the content
    text = 'Hello World!';

    for( i=0; i< text.length; i++ ) {
      this._container.append('<span>' + text[i] + '</span>');
    }    

    // Internal method to initialize the event of select 'Hello'  
    this._addSelectionTrigger();
    
    // Internal method to set the onClick event 
    this._addSimpleClickTrigger();
  },

  /**
   *  Default values for the options
   *  @name Biojs.BAMViewer-opt
   */
  opt: {
     target: "YourOwnDivId",
     fontFamily: '"Andale mono", courier, monospace',
     fontColor: "white",
     backgroundColor: "#7BBFE9",
     selectionFontColor: "black",
     selectionBackgroundColor: "yellow"
  },
  
  /**
   * Array containing the supported event names
   * @name Biojs.BAMViewer-eventTypes
   */
  eventTypes : [
  /**
   * @name Biojs.BAMViewer#onClick
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
   
  /**
   * @name Biojs.BAMViewer#onHelloSelected
   * @event
   * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
   * @eventData {Object} source The component which did triggered the event.
   * @eventData {string} type The name of the event.
   * @eventData {int} textSelected Selected text, will be 'Hello' obviously.
   * @example 
   * instance.onHelloSelected(
   *    function( objEvent ) {
   *       alert("The word " + objEvent.textSelected + " was selected.");
   *    }
   * ); 
   * 
   * */
     "onHelloSelected"      
  ], 
  
  /**
   * Change the font size. Do nothing it no value is provided.
   * 
   * @param {string} [size] The new font size in pixels.
   *
   * @example 
   * instance.setSize("72px");
   */
  setSize: function(size) {
    if ( size != undefined ){
      jQuery("#"+this.opt.target).css('font-size', size);
    }
  },
  

  /**
  * Parses the sam file.
  * @parm{string} [sam] The content of the file to parse
  * @return{string} js object representing the array of SAM lines as objects
  *
  *
  */

  parse_sam: function(sam){

  var lines=tsv.split("\n"); 
  var result = [];

  for(var i=0;i<lines.length;i++){
    obj = self.parse_sam_line(lines[i]);
    result.push(obj);
  }
  
  return result; //JavaScript object
  //return JSON.stringify(result); //JSON
  },
  
  /** 
  * Parses a line from the SAM specification as follows:  
  *  1 QNAME String
  *  2 FLAG Int
  *  3 RNAME String
  *  4 POS Int
  *  5 MAPQ Int
  *  6 CIGAR String
  * 7 RNEXT String
  * 8 PNEXT Int
  * 9 TLEN Int
  * 10 SEQ String
  * 11 QUAL String
  * The optional tags are added as elements in the object, and if the type is integer (i) of float (f)  they are parsed. The rest of the
  * types are treated as string. 
  *@param {string} [sam_line] The line to parse
  * 
  */
  parse_sam_line: function(sam_line){
    var obj = {};
    var currentline = sam_line.split("\t");
    obj.qname = currentline[0] ;
    obj.flag  = parseInt(currentline[1]) ;
    obj.rname = currentline[2] ;
    obj.pos   = parseInt(currentline[3]) ;
    obj.mapq  = parseInt(currentline[4]) ;
    obj.cigar = currentline[5] ;
    obj.rnext = currentline[6] ;
    obj.pnext = parseInt(currentline[7]);
    obj.tlen  = parseInt(currentline[8]) ;
    obj.seq   = currentline[9] ;
    obj.qual  = currentline[10] ;

    for(var j=12;j < currentline.length;j++){
      var tag = sam_line[k].split(":")
     
      if (tag[1] == "i"){
       obj[tag[0]] = parseInt(tag[2]);
      }else if (tag[1 == "f"]){
        obj[tag[0]] = parseFloat(tag[2]);
      }
      else{ 
        obj[tag[0]] = tag[2];
      }
    }
    return obj;
  },

  /**
  * Loads a region and stores it in the cache 
  */
  load_region: function(chr,start, end){
    jQuery.ajax({
                type: "GET",
                url: self.opt.dataSet,
                dataType: "text",
                success: function (data) {
                    correct = true
                    if(correct)
                      //TODO: call the parser and store the data in an indexed way. 
                    } else {
                        alert("Unknown format detected")
                    }

                },
                error: function (qXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
  },
  
  _addSelectionTrigger: function() {

    var self = this;
    var isMouseDown = false;
    
    // Create the CSS class called selected to change both background and color 

    jQuery('<style> .selected { '+
        'background-color:' + self.opt.selectionBackgroundColor + ';' +
        'color:' + self.opt.selectionFontColor +'; }</style>'
        ).appendTo('head');
    
    //
    // Add the click event to each character in the content
    // But remember, we must to figure out when 'Hello' is selected only
    this._container.find('span')
      .mousedown(function() {
        
        // Turn on the flag 
      isMouseDown = true;
      
      // A new selection is starting
      // Reset all by removing the CSS "selected" class if already applied
      self._container.children('span').removeClass('selected')
      
      // Apply the class for this span/character
      // NOTE: "this" refers to the internal object 'span'
      // NOT to the component's instance
      jQuery(this).addClass('selected');
        
      }).mouseover(function() {
        // Check if the mouse is being dragged  
      if (isMouseDown) {
        jQuery(this).addClass('selected');
      } 
    })
    .mouseup(function() {
      
      /// Turn off the flag 
      isMouseDown = false;
      
      var textSelected = '';
      
      // Get the entire selected word
      self._container.children('span.selected')
        .each(function(){
          textSelected += jQuery(this).text();
        });
      
      // Since requirements, only "Hello" word should be selected 
      // to raise the event
      if (textSelected == 'Hello') {
        self.raiseEvent('onHelloSelected', {
          textSelected : textSelected
        })
      }
    });
  },
  
  _addSimpleClickTrigger: function () {
    
    var self = this;
    
    // Add the click event to each character in the content
    this._container.find('span')
      .click( function(e) {
        // A letter was clicked!
        // Let's discover which one was it
        // TIP: e.target contains the clicked DOM node
        var selected = jQuery(e.target).text();
        
        // Create an event object 
        var evtObject = { "selected": selected };
        
        // We're ready to raise the event onClick of our component
        self.raiseEvent('onClick', evtObject);
      });
  }
  
});







