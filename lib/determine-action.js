module.exports = function(params) {
 if(params.deleted === true) {
   return 'erase';
 } else {
   return 'deploy';
 }
}
