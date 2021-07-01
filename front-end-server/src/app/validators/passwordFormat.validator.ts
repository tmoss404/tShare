import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";


export function passwordFormat() : ValidatorFn {

    return (passwordControl: AbstractControl) => {

        const validSymbols = "-_!@#$%^&*()=+";
        const validNums = "0123456789";
        const validPwdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + validNums + validSymbols;
        
        if(passwordControl.value == null || passwordControl.value.length === 0)
            return null;

        for (var i = 0; i < passwordControl.value.length; i++)
            if (!validPwdChars.includes(passwordControl.value[i].toUpperCase()))
                return { 'invalidChars' : true };

        if(passwordControl.value.length < 9)
            return { 'invalidLength' : true };

        if(!strContainsCharIn(passwordControl.value, validNums))
            return { 'noNumbers' : true };

        if(!strContainsCharIn(passwordControl.value, validSymbols))
            return { 'noSymbols' : true };
      
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