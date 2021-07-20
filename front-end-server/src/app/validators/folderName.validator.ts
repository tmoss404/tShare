import { AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";


export function folderName() : ValidatorFn {

    return (folderNameControl: AbstractControl) => {

        const invalidChars = "\"*:<>?/\\|";
        
        if(folderNameControl.value == null || folderNameControl.value.length === 0)
            return null;

        if(strContainsCharIn(folderNameControl.value, invalidChars))
            return { 'invalidChars' : true };
      
    };
}

function strContainsCharIn(str: string, characterList: string) {
    for ( var i = 0; i < characterList.length; i++) {
        if (str.includes("" + characterList[i])) {
            return true;
        }
    }
    return false;
}