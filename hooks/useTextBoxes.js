import { useState, useEffect } from 'react';
import { saveTextBoxes, subscribeToTextBoxes } from '../services/vtuberDatabaseService';

export const TEXT_BOX_GROUPS = ['A', 'B', 'C', 'D', 'E'];

export const TEXT_BOX_COLORS = [
  { label: 'แดง', value: '#C0392B' },
  { label: 'น้ำเงิน', value: '#2980B9' },
  { label: 'เขียว', value: '#27AE60' },
  { label: 'ม่วง', value: '#8E44AD' },
  { label: 'เทา', value: '#555555' },
  { label: 'ส้ม', value: '#E67E22' },
  { label: 'ทอง', value: '#FFD700' },
  { label: 'ชมพู', value: '#E91E63' },
];

export function useTextBoxes() {
  const [textBoxes, setTextBoxes] = useState([]);
  const [newBoxText, setNewBoxText] = useState('');
  const [newBoxColor, setNewBoxColor] = useState('#C0392B');
  const [newBoxSelectedColor, setNewBoxSelectedColor] = useState('#FFD700');
  const [newBoxGroup, setNewBoxGroup] = useState('A');
  const [activeGroup, setActiveGroup] = useState('A');

  useEffect(() => {
    const unsub = subscribeToTextBoxes((data) => {
      setTextBoxes(Array.isArray(data) ? data : []);
    });
    return unsub;
  }, []);

  const handleAddTextBox = async () => {
    if (!newBoxText.trim()) return;
    const updated = [...textBoxes, {
      id: Date.now().toString(),
      text: newBoxText.trim(),
      group: newBoxGroup,
      visible: false,
      selected: false,
    }];
    await saveTextBoxes(updated);
    setNewBoxText('');
  };

  const handleMoveTextBox = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= textBoxes.length) return;
    const updated = [...textBoxes];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    await saveTextBoxes(updated);
  };

  const handleShowGroup = async (group) => {
    setActiveGroup(group);
    setNewBoxGroup(group);
    const updated = textBoxes.map(box => ({
      ...box,
      visible: box.group === group,
    }));
    await saveTextBoxes(updated);
  };

  const handleApplyColors = async () => {
    const updated = textBoxes.map(box => ({
      ...box,
      color: newBoxColor,
      selectedColor: newBoxSelectedColor,
    }));
    await saveTextBoxes(updated);
  };

  const handleToggleTextBox = async (id) => {
    const updated = textBoxes.map(box =>
      box.id === id ? { ...box, visible: !box.visible } : box
    );
    await saveTextBoxes(updated);
  };

  const handleRemoveTextBox = async (id) => {
    const updated = textBoxes.filter(box => box.id !== id);
    await saveTextBoxes(updated);
  };

  const handleShowAllTextBoxes = async (show) => {
    const updated = textBoxes.map(box => ({ ...box, visible: show }));
    await saveTextBoxes(updated);
  };

  const handleSelectTextBox = async (id) => {
    const updated = textBoxes.map(box =>
      box.id === id ? { ...box, selected: !box.selected } : box
    );
    await saveTextBoxes(updated);
  };

  return {
    textBoxes,
    newBoxText, setNewBoxText,
    newBoxColor, setNewBoxColor,
    newBoxSelectedColor, setNewBoxSelectedColor,
    newBoxGroup, setNewBoxGroup,
    activeGroup,
    handleAddTextBox,
    handleMoveTextBox,
    handleShowGroup,
    handleApplyColors,
    handleToggleTextBox,
    handleRemoveTextBox,
    handleShowAllTextBoxes,
    handleSelectTextBox,
  };
}
