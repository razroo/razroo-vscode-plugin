export const replaceCurlyBrace = (parameters: Object, fileStringWithOrWithouCurlyBrace: string) => {
  const keyString = `{[^<>]*}`;
  const keyStringRegex = new RegExp(keyString, 'g');
  const templateVariables = fileStringWithOrWithouCurlyBrace?.match(keyStringRegex);
  if(templateVariables && templateVariables[0]) {
    const paramName = templateVariables[0].replace('{', '').replace('}', '');
    console.debug('paramName');
    console.debug(paramName);
    
    return parameters[paramName];
  }
  else {
    // no curly brace return as is
    return fileStringWithOrWithouCurlyBrace;
  }
};