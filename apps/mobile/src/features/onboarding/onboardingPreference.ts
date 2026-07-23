import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cozbil/onboardingDone';

/** Local unlock when Firestore/Auth is flaky on phone dogfood. */
export async function readOnboardingDoneLocal(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function writeOnboardingDoneLocal(done: boolean): Promise<void> {
  try {
    if (done) await AsyncStorage.setItem(KEY, '1');
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // non-fatal
  }
}
