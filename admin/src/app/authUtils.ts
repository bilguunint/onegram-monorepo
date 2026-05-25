import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

class FirebaseAuthBackend {
    constructor(firebaseConfig) {
        if (firebaseConfig) {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    sessionStorage.setItem('authUser', JSON.stringify(user));
                } else {
                    sessionStorage.removeItem('authUser');
                }
            });
        }
    }

    /**
     * Registers the user with given details
     */
    registerUser = (email, password) => {
        return new Promise((resolve, reject) => {
            firebase.auth().createUserWithEmailAndPassword(email, password).then((user: any) => {
                var user: any = firebase.auth().currentUser;
                resolve(user);
            }, (error) => {
                reject(this._handleError(error));
            });
        });
    }

    /**
     * Login user with given details and check admin role
     */
    loginUser = (email, password) => {
        return new Promise((resolve, reject) => {
            firebase.auth().signInWithEmailAndPassword(email, password).then(async (userCredential: any) => {
                const user = userCredential.user;
                
                try {
                    // Check if user exists in admins collection
                    const adminDoc = await firebase.firestore()
                        .collection('admins')
                        .doc(user.uid)
                        .get();
                    
                    if (adminDoc.exists) {
                        const adminData = adminDoc.data();
                        
                        // Check if user has valid admin role
                        const validRoles = ['admin', 'manager', 'accountant'];
                        if (adminData && validRoles.includes(adminData.role)) {
                            // Set user data with admin info
                            const userWithRole = {
                                uid: user.uid,
                                email: user.email,
                                name: adminData.name,
                                role: adminData.role,
                                emailVerified: user.emailVerified
                            };
                            
                            sessionStorage.setItem('authUser', JSON.stringify(userWithRole));
                            sessionStorage.setItem('adminData', JSON.stringify(adminData));
                            
                            resolve(userWithRole);
                        } else {
                            // User exists but doesn't have valid admin role
                            await firebase.auth().signOut();
                            reject('Access denied. Invalid admin role.');
                        }
                    } else {
                        // User not found in admins collection
                        await firebase.auth().signOut();
                        reject('Access denied. User not found in admin records.');
                    }
                } catch (firestoreError) {
                    // Error accessing Firestore
                    await firebase.auth().signOut();
                    reject('Error checking admin credentials: ' + firestoreError.message);
                }
            }).catch((error) => {
                reject(this._handleError(error));
            });
        });
    }

    /**
     * forget Password user with given details
     */
    forgetPassword = (email) => {
        return new Promise((resolve, reject) => {
            // tslint:disable-next-line: max-line-length
            firebase.auth().sendPasswordResetEmail(email, { url: window.location.protocol + '//' + window.location.host + '/login' }).then(() => {
                resolve(true);
            }).catch((error) => {
                reject(this._handleError(error));
            });
        });
    }

    /**
     * Logout the user
     */
    logout = () => {
        return new Promise((resolve, reject) => {
            firebase.auth().signOut().then(() => {
                sessionStorage.removeItem('authUser');
                sessionStorage.removeItem('adminData');
                resolve(true);
            }).catch((error) => {
                reject(this._handleError(error));
            });
        });
    }

    setLoggeedInUser = (user) => {
        sessionStorage.setItem('authUser', JSON.stringify(user));
    }

    /**
     * Returns the authenticated user
     */
    getAuthenticatedUser = () => {
        if (!sessionStorage.getItem('authUser')) {
            return null;
        }
        return JSON.parse(sessionStorage.getItem('authUser'));
    }

    /**
     * Returns the admin data
     */
    getAdminData = () => {
        if (!sessionStorage.getItem('adminData')) {
            return null;
        }
        return JSON.parse(sessionStorage.getItem('adminData'));
    }

    /**
     * Check if current user has specific role
     */
    hasRole = (role: string) => {
        const adminData = this.getAdminData();
        return adminData && adminData.role === role;
    }

    /**
     * Check if current user has any of the specified roles
     */
    hasAnyRole = (roles: string[]) => {
        const adminData = this.getAdminData();
        return adminData && roles.includes(adminData.role);
    }

    /**
     * Handle the error
     * @param {*} error
     */
    _handleError(error) {
        // tslint:disable-next-line: prefer-const
        var errorMessage = error.message;
        return errorMessage;
    }
}

// tslint:disable-next-line: variable-name
let _fireBaseBackend = null;

/**
 * Initilize the backend
 * @param {*} config
 */
const initFirebaseBackend = (config) => {
    if (!_fireBaseBackend) {
        _fireBaseBackend = new FirebaseAuthBackend(config);
    }
    return _fireBaseBackend;
};

/**
 * Returns the firebase backend
 */
const getFirebaseBackend = () => {
    return _fireBaseBackend;
};

export { initFirebaseBackend, getFirebaseBackend };
