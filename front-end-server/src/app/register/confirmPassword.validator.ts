import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";


export function ConfirmPassword( password: string, confirm: string) : ValidatorFn{

    return (formGroup: AbstractControl) : ValidationErrors => {
        const passwordControl = formGroup.get(password);
        const confirmControl = formGroup.get(confirm);

        if(confirmControl?.errors && !confirmControl.errors.noMatch){
            return null;
        }

        if(confirmControl.value !== passwordControl.value){
            confirmControl.setErrors({ noMatch : true });
            return({ noMatch : true });
        } else {
            confirmControl.setErrors(null);
            return null;
        }
    };
}