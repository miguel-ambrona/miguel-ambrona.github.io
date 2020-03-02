ace.define("ace/theme/mytheme",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-mytheme";
exports.cssText = ".ace-mytheme .ace_gutter {\
background: #272727;\
color: #FFF\
}\
.ace-mytheme .ace_print-margin {\
width: 1px;\
background: #272727\
}\
.ace-mytheme {\
background-color: #2D2D2D;\
color: #DDD\
}\
.ace-mytheme .ace_constant.ace_other,\
.ace-mytheme .ace_cursor {\
color: #CCCCCC\
}\
.ace-mytheme .ace_marker-layer .ace_selection {\
background: #515151\
}\
.ace-mytheme.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #2D2D2D;\
}\
.ace-mytheme .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-mytheme .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #6A6A6A\
}\
.ace-tomorrow-night-bright .ace_stack {\
background: rgb(66, 90, 44)\
}\
.ace-mytheme .ace_marker-layer .ace_active-line {\
background: #393939\
}\
.ace-mytheme .ace_gutter-active-line {\
background-color: #393939\
}\
.ace-mytheme .ace_marker-layer .ace_selected-word {\
border: 1px solid #515151\
}\
.ace-mytheme .ace_invisible {\
color: #6A6A6A\
}\
.ace-mytheme .ace_keyword,\
.ace-mytheme .ace_meta,\
.ace-mytheme .ace_storage,\
.ace-mytheme .ace_storage.ace_type,\
.ace-mytheme .ace_support.ace_type {\
color: #FFC1FF\
}\
.ace-mytheme .ace_keyword.ace_operator {\
color: #66CCCC\
}\
.ace-mytheme .ace_zp {\
color: #F78282;\
font-weight: bold;\
}\
.ace-mytheme .ace_quantifications {\
color: #C29BF5\
}\
.ace-mytheme .ace_rules {\
color: #F5F6CE\
}\
.ace-mytheme .ace_bigops {\
color: #F5A9BC\
}\
.ace-mytheme .ace_constant.ace_character,\
.ace-mytheme .ace_constant.ace_language,\
.ace-mytheme .ace_constant.ace_numeric,\
.ace-mytheme .ace_keyword.ace_other.ace_unit,\
.ace-mytheme .ace_support.ace_constant,\
.ace-mytheme .ace_variable.ace_parameter {\
color: #F7BE81\
}\
.ace-mytheme .ace_invalid {\
color: #CDCDCD;\
background-color: #F2777A\
}\
.ace-mytheme .ace_invalid.ace_deprecated {\
color: #CDCDCD;\
background-color: #CC99CC\
}\
.ace-mytheme .ace_fold {\
background-color: #6699CC;\
border-color: #CCCCCC\
}\
.ace-mytheme .ace_entity.ace_name.ace_function,\
.ace-mytheme .ace_support.ace_function,\
.ace-mytheme .ace_variable {\
color: #81DAF5\
}\
.ace-mytheme .ace_support.ace_class,\
.ace-mytheme .ace_support.ace_type {\
color: #FFCC66\
}\
.ace-mytheme .ace_heading,\
.ace-mytheme .ace_markup.ace_heading,\
.ace-mytheme .ace_string {\
color: #99CC99\
}\
.ace-mytheme .ace_comment {\
color: #999999\
}\
.ace-mytheme .ace_entity.ace_name.ace_tag,\
.ace-mytheme .ace_entity.ace_other.ace_attribute-name,\
.ace-mytheme .ace_meta.ace_tag,\
.ace-mytheme .ace_variable {\
color: #F2777A\
}\
.ace-mytheme .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWPQ09NrYAgMjP4PAAtGAwchHMyAAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
