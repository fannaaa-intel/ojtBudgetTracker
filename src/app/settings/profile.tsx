import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Screen, TextField, ToggleRow } from '@/components';
import { getProfile } from '@/features/profile/queries';
import { updateProfile } from '@/features/settings/queries';
import { isValidName } from '@/lib/profile';
import { showSnack } from '@/store/snackbar';

export default function EditProfile() {
  const [p] = useState(() => getProfile());
  const [name, setName] = useState(p?.user.name ?? '');
  const [nickname, setNickname] = useState(p?.user.nickname ?? '');
  const [school, setSchool] = useState(p?.user.school ?? '');
  const [course, setCourse] = useState(p?.user.course ?? '');
  const [isStudent, setIsStudent] = useState(p?.user.isStudent ?? true);
  const [showError, setShowError] = useState(false);
  if (!p) return null;

  function save() {
    if (!isValidName(name)) return setShowError(true);
    updateProfile(p!.user.id, { name, nickname, school, course, isStudent });
    router.back();
    showSnack('Profile saved');
  }

  return (
    <Screen insetTop={false} title="Profile" footer={<Button label="Save" onPress={save} />}>
      <TextField label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={showError && !isValidName(name) ? 'At least 2 letters' : null} />
      <TextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} />
      <TextField label="School" value={school} onChangeText={setSchool} />
      <TextField label="Course" value={course} onChangeText={setCourse} />
      <ToggleRow
        label="Student fare discount"
        description="20% off jeeps and buses, 50% off LRT/MRT single tickets. Saved routes re-price right away; past entries keep what you paid."
        value={isStudent}
        onChange={setIsStudent}
      />
    </Screen>
  );
}
