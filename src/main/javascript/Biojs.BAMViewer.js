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

    // Disable text selection and
    // Change the selection mouse pointer  
    // from text to hand.
    this._container.css({
      '-moz-user-select':'none',
      '-webkit-user-select':'none',
      'user-select':'none'
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
    height: "100%",
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
    console.log("Parsing flagg:" +  parseInt(currentline[1],10));

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
      build_div: function(l_container){
              var new_div = document.createElement("div");
              l_container.appendChild(new_div);
              //Get the space for the bar
              new_div.style.height = container.opt.fontSize ;

              
              new_div.style.position = "absolute";
              n_pos = ( this.pos - 1) * container.opt.base_width;
              //alert(n_pos);
              new_div.style.left = n_pos + "px";

              if(this.forward()){
                new_div.classList.add("bam_forward");
              }else{
                new_div.classList.add("bam_reverse");
              }

              //new_div.style.backgroundColor = container.opt.default_read_background;
              
              //Parse the cigar and build the divs stuff:
              
              var cigars = this.cigar.replace(/([SIXMND])/g, ":$1,");
              var cigars_array = cigars.split(',');
             // console.log(JSON.stringify(cigars_array));
              //for (var i = 0; i < cigars_array.length - 1; i++) {

              //}
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
                  //console.log("parsing cigar " + i + "< " + cig_end);
                  //console.log("Cig index: " + cig_index);
                  //console.log ("c:" + cigars_array[cig_index]);
                  cig = cigars_array[cig_index].split(":"); 
                  key = cig[1];
                  length = parseInt(cig[0]);
                  cig_end = i + length;
                  //console.log("k:" + key + " l:" + length);
                  cig_index +=1
                  changed = false;

                }
                if(key == "M" || key == "X" || key == "="){
                  display_base = this.seq[i];
                  var current_base_span = document.createElement("div");
                  new_div.appendChild(current_base_span);
                  //current_base_span.classList.add("bam_base");
                  //current_base_span.classList.add("bam_base_" + display_base);
                  current_base_span.className = "bam_base_" + display_base;
                  current_base_span.style.width = container.opt.base_width + "px";
                  current_base_span.style.cssFloat = "left";
               
                  //current_base_span.classList.add("bam_base_" + display_base );
                
                  //current_base_span.setAttribute('id', "bam_base_" + display_base);
                  current_base_span.appendChild(current_base_span.ownerDocument.createTextNode(display_base));
                  last_div = current_base_span;

                  

                  this.len += 1
                  current_base_span.id = this.len
                }else if(key == "I"){
                  last_div.classList.add("bam_base_I");
                  //i--;
                  changed = true;
                  //console.log("Insertion in: " + this.len);
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
                     new_div.appendChild(current_base_span);
                     this.len += 1;
                      current_base_span.id = this.len
                  }
                  changed = true;
                  //cig_index += 1;
                  i--;
                }
              }

              

              //this.len = this.seq.length;
              new_div.style.width = container.opt.base_width * this.len + "px"; 
              //new_div.refresh;

              

              //new_div.appendChild(new_div.ownerDocument.createTextNode(this.seq));
              


              this.div = new_div;
              //alert(this.qname);
              //alert(new_div);
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
      var region = this.current_region;
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
             //canvas.appendChild(aln.div);

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
    //reg = region.entry + ":" + region.start + "-" + region.end;
    //TODO: Force the region to be up to a maximum size. 
    reg = region.toString;


  //http://localhost:4567/region?bam=testu&region=chr_1:1-400&ref=test_chr.fasta 
  jQuery.ajax({
    type: "GET",
    url: this.dataSet,
    data: { region: reg, ref: this.reference } ,
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

  var new_div = document.createElement("div");
  
  new_div.addEventListener('dragstart',this._drag_start,false); 
  new_div.addEventListener('dragover',this._drag_over,false); 
  new_div.addEventListener('drop',this._drop,false); 
  new_div.style.width = this.opt.width;
  new_div.draggable = "true";
  //new_div.style.width = this.opt.base_width * this.full_region.end;
  new_div.style.position = "absolute";
  new_div.style.overflow = "scroll";
  new_div.style.height = this.opt.height;
  //new_div.id =;
  //new_div.draggable({ containment: "parent" });
  //new_div.style.left = 0;
  //new_div.style.top = 0;
  new_div.bam_container = this;
  this._render_div = new_div;    
  this._container.append(new_div);  
}, 

drag_offset_data : "" ,  //Global variable as Chrome doesn't allow access to event.dataTransfer in dragover

_drag_start: function (event) {
    offset_data = event.clientX + ',' +  event.clientY;
    _startX = event.clientX;
    _bam_offset_data= offset_data;
    _tmp_target = event.target;
},

_move_draged: function(render_div, offset, event){

  console.log("From " +  _startX + " to " + event.clientX);
  var diff_x =  event.clientX   - _startX  ;
  var als_rend = render_div.children;
  for(var i = 0; i < als_rend.length; i++) {
    var local_left = parseInt(als_rend[i].offsetLeft , 10);
    var new_pos = local_left + diff_x;
    als_rend[i].style.left = new_pos + "px";

  }
  //var diff_y = event.clientX - parseInt(offset[0],10); 
},

_drag_over: function (event) { 
    var offset;
    offset = _bam_offset_data;
    var dm = _tmp_target ;
    var render_div =  _tmp_target ;
    //render_div.bam_container._move_draged(render_div, offset, event);
    event.preventDefault(); 
    return false; 
} ,
_drop: function (event) { 
    var offset;
    offset = _bam_offset_data;  
    var render_div =  _tmp_target ;
    render_div.bam_container._move_draged(render_div, offset, event);
    render_div.bam_container._move_to_top();
    event.preventDefault();
    return false;
}, 

_move_to_top: function  (){
  var top = 1; // top value for next row
  var margin = 1; // space between rows
  var rows = []; // list of rows
  
    for (var c = 0; c < this._render_div.children.length; c++) {

        var ok = false;
        var child = this._render_div.children[c];
        //var cr = child.getBoundingClientRect();
        var cr = {};
        cr.top = child.offsetTop;
        cr.left = child.offsetLeft;
        //console.log("current width: " + child.style.width);
        cr.right = cr.left + parseInt(child.style.width, 10);
        cr.bottom = cr.top + parseInt(child.style.height, 10);
       
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
                left: cr.left
            }); 
            child.style.top = top + "px";
            //alert(child.getBoundingClientRect().bottom);
            top =  child.offsetTop + parseInt(child.style.height, 10) + margin;
        }
    }
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
   this._container.reg;
   //alert(JSON.stringify(reg));
   this.current_region = reg;
   this.load_region(reg);
 }


});

_BAMRegion = function _BAMRegion(entry, start, end) {
  this.entry = entry;
  this.start = start;
  this.end = end;
  this.toString = function() {
    return  entry + ":" + start  + "-" + end;
  };
} ;

//_BAMRegion.prototype.toString = f
//;





