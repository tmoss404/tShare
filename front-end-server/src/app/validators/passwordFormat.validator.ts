import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";


export function passwordFormat() : ValidatorFn {

    return (formGroup: AbstractControl) : ValidationErrors => {

        const validSymbols = "-_!@#$%^&*()=+";
        const validNums = "0123456789";
        const validPwdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + validNums + validSymbols;

        const passwordControl = formGroup.get("password");
        
        if(!passwordControl.errors?.required){
            for (var i = 0; i < passwordControl.value.length; i++) {
                if (!validPwdChars.includes(("" + passwordControl.value[i]).toUpperCase())) {
                    passwordControl.setErrors({ invalidChars : true });
                    return { invalidChars : true };
                }
            }

            if(passwordControl.value.length < 9){
                passwordControl.setErrors({ invalidLength : true });
                return { invalidLength : true };
            }

            if(!strContainsCharIn(passwordControl.value, validNums)){
                passwordControl.setErrors({ noNumbers : true });
                return { noNumbers : true };
            }

            if(!strContainsCharIn(passwordControl.value, validSymbols)){
                passwordControl.setErrors({ noSymbols : true });
                return { noSymbols : true };
            }
        }else{
            return null;
        }
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