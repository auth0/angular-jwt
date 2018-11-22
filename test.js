public AuthorizedCallback() {
         
    ...
         
    if (authResponseIsValid) {
         
        ...
 
        if (this._configuration.silent_renew) {
            this._oidcSecuritySilentRenew.initRenew();
        }
 
        this.runTokenValidatation();
 
        this._router.navigate([this._configuration.startupRoute]);
    } else {
        this.ResetAuthorizationData();
        this._router.navigate(['/Unauthorized']);
    }
 
}
