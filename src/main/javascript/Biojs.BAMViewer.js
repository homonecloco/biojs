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
 *    selectionBackgroundColor : '#99FF00',
 *    dataSet: "../biojs/data/BAMViewerDataSet.txt", 
 *    reference: "../biojs/data/test_chr.fasta",
 *    entry  : "chr_1",
 *    start  : 1, 
 *    end    : 500
 * });  
 * 
 */

 var _bam_offset_data;
 var _tmp_target;
 var _startX ;
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

      'font-size': self.opt.fontSize,
      'text-align': 'center',
      'vertical-align':'top',
      'display': 'table-cell',
      'width': self.opt.width,
      'height': self.opt.height,
      'float' : self.opt.float_bam, 
      'overflow': 'auto'    
    });

   

    // Set the content
    
    this._container.append('<div>Please select a region</div>');
   
    


    //Here starts the real SAM stuff. 
    this.dataSet = options.dataSet
    this.reference = options.reference;

    //An array with all the alignments. Each position represents a position in the chromosome. 
    this.alignments = {}

    if(options.entry){
      var cr = new _BAMRegion(options.entry, options.start, options.end);
      this.current_region = cr;
      this.load_region(cr);
    }
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
    selectionBackgroundColor: "yellow",
    dataSet: "../../main/resources/data/BAMViwerDataSet.tsv", 
    fontSize: "15px",
    width: "80%",
    height: "600px",
    float_bam: "right",
    base_width: 10,
    default_read_background:"blue"

  },
  
  /**
   * Array containing the supported event names
   * @name Biojs.BAMViewer-eventTypes
   */
   eventTypes : [

   /**
   * @name Biojs.BAMViewer#onRegionChanged
   * @event
   * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
   * @eventData {Object} source The component which did triggered the event.
   * @eventData {string} type The name of the event.
   * @eventData {string} the new region (chr_1:1-400)
   * @example 
   * instance.onHelloSelected(
   *    function( objEvent ) {
   *       alert("The word " + objEvent.region + " was selected.");
   *    }
   * ); 
   * 
   * */
   "onRegionChanged"    
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
  

  parse_region: function(reg) {
      //TODO: validate 
      ent=reg.split(":");
      indeces=ent[1].split("-")
      var reg = new _BAMRegion(ent[0], indeces[0], indeces[1]);
      return reg;
    },

  /**
  * Parses the sam file.
  * @parm{string} [sam] The content of the file to parse
  * @return{string} js object representing the array of SAM lines as objects
  *
  *
  */

  parse_sam: function(sam){

    var lines=sam.split("\n"); 
    var result = [];

    for(var i=0;i<lines.length;i++){
      obj = this.parse_sam_line(lines[i]);
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
    var currentline = sam_line.split("\t");

    var cigar = currentline[5] 
    container = this;
    //console.log("Parsing flagg:" +  parseInt(currentline[1],10));

    var obj = {
      qname : currentline[0] ,
      flags : parseInt(currentline[1],10),
      rname : currentline[2] ,
      pos   : parseInt(currentline[3],10) ,
      mapq  : parseInt(currentline[4],10) ,
      cigar : currentline[5] ,
      rnext : currentline[6] ,
      pnext : parseInt(currentline[7],10),
      tlen  : parseInt(currentline[8],10) ,
      seq   : currentline[9] ,
      qual  : currentline[10] ,
      len   : 100, //TODO: change this to use the cigar.  
      has_flag : function (f){ 
        f = parseInt(f);
        return (this.flags & f) == f ;
      },
      forward: function(){return  this.has_flag(16);},
      build_div: function(){
              var new_div = document.createElement("div");
              new_div.style.height = container.opt.fontSize ;
              new_div.style.position = "absolute";
              n_pos = ( this.pos - 1) * container.opt.base_width;
              new_div.style.left = n_pos + "px";

              if(this.forward()){
                new_div.classList.add("bam_forward");
              }else{
                new_div.classList.add("bam_reverse");
              }
              
              var cigars = this.cigar.replace(/([SIXMND])/g, ":$1,");
              var cigars_array = cigars.split(',');
              var cig_index = 0;
              this.len = 0
              var cig_end  = -1;
              var cig ;
              var key;
              var length;
              var cig_index = 0;
              var last_div;
              changed = true;
              for ( var i = 0; i < this.seq.length; i++ ){
                if(i > cig_end || changed == true){
                  cig = cigars_array[cig_index].split(":"); 
                  key = cig[1];
                  length = parseInt(cig[0]);
                  cig_end = i + length;
                  cig_index +=1
                  changed = false;

                }
                if(key == "M" || key == "X" || key == "="){
                  display_base = this.seq[i];
                  var current_base_span = document.createElement("div");
                  new_div.appendChild(current_base_span);
                  current_base_span.className = "bam_base_" + display_base;
                  current_base_span.style.width = container.opt.base_width + "px";
                  current_base_span.style.cssFloat = "left";
                  current_base_span.appendChild(current_base_span.ownerDocument.createTextNode(display_base));
                  
                  last_div = current_base_span;
                  current_base_span.title = this.len + this.pos;
                  this.len += 1;
                  
                }else if(key == "I"){
                  last_div.classList.add("bam_base_I");
                  changed = true;
                }else if(key == "D" || key == "N"){
                  for (var j  = 0; j < length; j ++ ) {
                     display_base =  "*";
                     var current_base_span = document.createElement("div");
                     current_base_span.classList.add("bam_base");
                     current_base_span.classList.add("bam_base_D");
                     current_base_span.style.width = container.opt.base_width + "px";
                     current_base_span.style.cssFloat = "left";
                     current_base_span.appendChild(current_base_span.ownerDocument.createTextNode(display_base));
                     last_div = current_base_span;
                     current_base_span.title = this.len + this.pos;
                     new_div.appendChild(current_base_span);
                     this.len += 1;
                     current_base_span.id = this.len;
                  }
                  changed = true;
                  //cig_index += 1;
                  i--;
                }
              }
              new_div.style.width = container.opt.base_width * this.len + "px"; 
              this.div = new_div;
              return new_div;
    }};


    /* @is_paired  = (@flag & 0x0001) > 0
        @is_mapped             = @flag & 0x0002 > 0
        @query_unmapped        = @flag & 0x0004 > 0
        @mate_unmapped         = @flag & 0x0008 > 0
        @query_strand          = !(@flag & 0x0010 > 0)
        @mate_strand           = !(@flag & 0x0020 > 0)
        @first_in_pair         = @flag & 0x0040 > 0
        @second_in_pair        = @flag & 0x0080 > 0
        @primary               = !(@flag & 0x0100 > 0)
        @failed_quality        = @flag & 0x0200 > 0
        @is_duplicate          = @flag & 0x0400 > 0*/

        for(var j=12;j < currentline.length;j++){
          var tag = sam_line[j].split(":")

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

    render_visible: function(){
      var region = this.visible_region;
      var start = region.start - this.opt.flanking_cache;
      var canvas = this._render_div;
      if(start < 0){
        start = 1;
      }
        
      //alert(JSON.stringify(this.alignments));
      for(i = start; i < region.end + this.opt.flanking_cache ; i++){
        if("undefined" !== typeof this.alignments[i]){
         // alert(JSON.stringify(this.alignments[i]) + " i:" + i);
          var current_alignments = this.alignments[i];
          //alert(JSON.stringify(current_alignments) + " i:" + i);
          for (var j in current_alignments) {
            aln = current_alignments[j];
            if("undefined" === typeof aln.div){ //We dont render it again if it already exists
             aln.build_div(canvas);
              //alert(JSON.stringify(aln.div));
             var n_pos = ( aln.pos - this._render_div.left_offset - 1) * container.opt.base_width; 
             aln.div.style.left = n_pos;
             canvas.appendChild(aln.div);
            }
          }
        }
      }
      //canvas.style.display='none';
      //canvas.style.offsetHeight;
      //canvas.style.display='block';
    },

    add_alignments: function(alignments){
      var als = this.alignments;
      var added = 0;
      for(var i = 0; i < alignments.length; i++){
        var aln = alignments[i];
        if("undefined" === typeof als[aln.pos]){
          als[aln.pos] = {}; 
        }
        var current_alignments = als[aln.pos];
        if("undefined" ===  typeof als[aln.pos][aln.qname]){
          added ++;
          als[aln.pos][aln.qname] = aln;
          //alert(JSON.stringify( current_alignments[aln.qname] ));
        }
      }
        //alert(JSON.stringify( this.alignments ));
    },

  /**
  * Loads a region and stores it in the cache 
  */
  load_region: function(region){
    //alert(self.dataSet);

    //alert(this.dataSet);
    reference = this.reference;
    
    //TODO: Force the region to be up to a maximum size. 
    reg = region.toString();
    //console.log("Loading: " + reg);

  //http://localhost:4567/region?bam=testu&region=chr_1:1-400&ref=test_chr.fasta 
  jQuery.ajax({
    type: "GET",
    url: this.dataSet,
    data: { region: reg } ,
    dataType: "text",
    container: this,
    success: function (data) {
      correct = true
      reads = this.container.parse_sam(data);
      if(reads.length > 0){
        this.container.add_alignments(reads);
        this.container.render_visible();
        this.container._move_to_top();
      } else {
        alert("Unknown format detected");
      }

    },
    error: function (qXHR, textStatus, errorThrown) {
      alert(" Error loading the  SAM File! \n" + textStatus + "\n" + errorThrown + "\n" + qXHR );
    }
  });
},

_select_chromosome: function(full_region){
  this._container.empty();
  this.alignments = {};
  this.full_region = this.parse_region(full_region); //New object, to avoid modifying the current region unintentionally.
	
  var outter_div = document.createElement("div");
  outter_div.style.width = this.opt.width;

  outter_div.style.position = "absolute";
  outter_div.style.overflow = "hidden";
  outter_div.style.height = this.opt.height;
  var new_div = document.createElement("div");
  new_div.classList.add("ui-widget-content");
  new_div.style.left = "0px";
  var grid_w = this.opt.base_width
  //jQuery(new_div).draggable({ axis: "x" });
  var start_pos = -1; 
  var self = this  ;
  jQuery(new_div).draggable({
    grid: [ 20, grid_w ] ,
    scroll: true, 
    
    start: function() {
        start_pos = parseInt(new_div.style.left);
      },

      drag: function() {
       
      },

      stop: function() {
        var top_pos = parseInt(new_div.style.top);
        var bottom_pos = parseInt(new_div.style.top) + parseInt(new_div.style.height) ;
        var height = parseInt(new_div.style.height);
        var left_pos = parseInt(new_div.style.left);
        var drag_offset = start_pos - left_pos;
        var drag_offset_bases = drag_offset / self.opt.base_width;
        self.visible_region.move(drag_offset_bases);
        info_div.removeChild(info_div.lastChild);
        info_div.appendChild(info_div.ownerDocument.createTextNode("Visible: " +  self.visible_region.toString()));
        
        self.load_region(self.visible_region);

        if(bottom_pos <= 50){
          new_div.style.top =  (50 - height ) + "px";
        }
        if(top_pos > 0){
          new_div.style.top =  "0px";
        }
        //counts[ 2 ]++;
        //updateCounterStatus( $stop_counter, counts[ 2 ] );
      }
  });

  new_div.bam_container = this;
  new_div.left_offset = 0;
  this._render_div = new_div;    
  outter_div.appendChild(new_div);
  this._container.append(outter_div);  

  var computedStyle = getComputedStyle(new_div, null);
  var visible_bases = parseInt(computedStyle.width) / this.opt.base_width;

  this.visible_region = this.parse_region(full_region);
  vr = this.visible_region
  this.visible_region.end = parseInt(visible_bases);
  //alert(computedStyle.marginTop)
  console.log(JSON.stringify(this.visible_region));

//SETTING UP THE BOTTOM THING
  var info_div = document.createElement("div");
  info_div.style.width - this.opt.base_width;
  info_div.classList.add("bam_info_panel");
  info_div.appendChild(info_div.ownerDocument.createTextNode("Visible: " +  this.visible_region.toString()));
  
  outer_info = document.getElementById(this.opt.info_panel);
  if(outer_info != null){
    outer_info.removeChild(outer_info.lastChild);
    outer_info.appendChild(info_div);  
  }

}, 

drag_offset_data : "" ,  //Global variable as Chrome doesn't allow access to event.dataTransfer in dragover

_drag_start: function (event) {
    offset_data = event.clientX + ',' +  event.clientY;
    _startX = event.clientX;
    _bam_offset_data= offset_data;
    _tmp_target = event.target;
},



_move_to_top: function  (){
  var top = 1; // top value for next row
  var margin = 1; // space between rows
  var rows = []; // list of rows
 // this._render_div.style.height = '300px';
  //this._render_div.style.display = 'none';
  
  parent = this._render_div.parentNode;
 // parent.removeChild(this._render_div);
  var row_depth = 0;
    for (var c = 0; c < this._render_div.children.length; c++) {
        var ok = false;
        var child = this._render_div.children[c];
        //var cr = child.getBoundingClientRect();
        var cr = {};
        cr.top = child.offsetTop;
        cr.left = child.offsetLeft;
        ch =  parseInt(child.style.height, 10)
        //console.log("current width: " + child.style.width);
        cr.right = cr.left + parseInt(child.style.width, 10);
        cr.bottom = cr.top + ch;
       
        for (var i = 0; i < rows.length; i++) {
          //   console.log("Moving to top" + i);
            if (cr.left > rows[i].right) {
                rows[i].right = cr.right;
                child.style.top = rows[i].top + "px";
                ok = true;
                break;
            }
            if (cr.right < rows[i].left) {
                rows[i].left = cr.left;
                child.style.top = rows[i].top + "px";
                ok = true;
                break;
            }
        }
        if (!ok) {
            // add new row
            rows.push({
                top: top,
                right: cr.right,
                left: cr.left,
                bottom: top + ch
            }); 
            //alert(child.getBoundingClientRect().bottom);
            child.style.top = top + ch + "px";
            top =  child.offsetTop + margin;
//            console.log("Top: " + top + "row_depth: " + row_depth);
            if(top + ch >= row_depth ){
              new_depth = top;
             // console.log("In the if: " + new_depth);
//              console.log("Before the change" + this._render_div.style.height);
              this._render_div.style.height = new_depth + 3* ch + "px";
//              console.log("After the change: " + this._render_div.style.height);
              row_depth = new_depth + ch;
            }

        }
    }
    console.log("New row_depth: " + row_depth);
 //   this._render_div.style.height = row_depth;
    parent.appendChild(this._render_div);
    this._render_div.style.display = 'block';
},

setRegion: function(region){
    //TODO: clear DIV if the entry is different to the current displayed entry. Also clear the cache. 
    var reg = this.parse_region(region);

   if("undefined" ===  typeof this.current_region || reg.entry != this.current_region.entry){
     this._select_chromosome(region);
   }

   local_width=this._render_div.clientWidth;

   //alert("width: " + local_width);
   region_end = Math.ceil( local_width/this.opt.base_width);
   //alert("region_end: " + region_end);
   reg.end = reg.start + region_end;
   console.log(reg.start +  ":" + region_end);
   this._container.reg;
   //alert(JSON.stringify(reg));
   this.current_region = reg;
   this.load_region(reg);
 }


});

_BAMRegion = function _BAMRegion(entry, start, end) {
  this.entry = entry,10;
  this.start = parseInt(start,10);
  this.end = parseInt(end,10);
  this.toString = function() {
    return  this.entry + ":" + this.start  + "-" + this.end;
  };
  this.move = function(bases) {
    this.end += bases;
    this.start += bases;
  };
} ;

//_BAMRegion.prototype.toString = f
//;





