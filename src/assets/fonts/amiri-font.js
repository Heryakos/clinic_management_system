(function (jsPDFAPI) {
    jsPDFAPI.addFont = function (postScriptName, id, fontStyle, encoding) {
      this.addFont(postScriptName, id, fontStyle, encoding);
    };
  })(window.jspdf.jsPDFAPI);
  
  var doc = new jsPDF();
  doc.addFileToVFS('Amiri-Regular.ttf', '/* Your font base64 string here */');
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');