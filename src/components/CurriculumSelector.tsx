import React from 'react';
import { Form, Card } from 'react-bootstrap';
import type { Curriculum } from '../curriculumData';
import type { Selection } from '../App';

interface Props {
  selection: Selection;
  onSelectionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  curriculumData: Curriculum;
}

const CurriculumSelector: React.FC<Props> = ({ selection, onSelectionChange, curriculumData }) => {
  const schoolKeys = Object.keys(curriculumData);
  const gradeKeys = selection.school ? Object.keys(curriculumData[selection.school]) : [];
  const semesterKeys = (selection.school && selection.grade) ? Object.keys(curriculumData[selection.school][selection.grade]) : [];
  const unitData = (selection.school && selection.grade && selection.semester) ? curriculumData[selection.school][selection.grade][selection.semester] : [];

  const unitKeys = unitData.map(unit => {
    if (typeof unit === 'string') {
      return unit;
    }
    if (typeof unit === 'object' && unit !== null) {
      return Object.keys(unit)[0];
    }
    return null;
  }).filter((key): key is string => key !== null);

  const subUnitKeys: string[] = [];
  if (selection.unit) {
    const selectedUnitObject = unitData.find(unit => 
      typeof unit === 'object' && unit !== null && Object.keys(unit)[0] === selection.unit
    );
    if (selectedUnitObject && typeof selectedUnitObject === 'object') {
      subUnitKeys.push(...Object.values(selectedUnitObject)[0]);
    }
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>과정 선택</Card.Title>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>학교</Form.Label>
            <Form.Select name="school" value={selection.school} onChange={onSelectionChange}>
              <option value="">학교 선택</option>
              {schoolKeys.map(school => <option key={school} value={school}>{school}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>학년</Form.Label>
            <Form.Select name="grade" value={selection.grade} onChange={onSelectionChange} disabled={!selection.school}>
              <option value="">학년 선택</option>
              {gradeKeys.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>학기</Form.Label>
            <Form.Select name="semester" value={selection.semester} onChange={onSelectionChange} disabled={!selection.grade}>
              <option value="">학기 선택</option>
              {semesterKeys.map(semester => <option key={semester} value={semester}>{semester}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>단원</Form.Label>
            <Form.Select name="unit" value={selection.unit} onChange={onSelectionChange} disabled={!selection.semester}>
              <option value="">단원 선택</option>
              {unitKeys.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>소단원</Form.Label>
            <Form.Select name="subUnit" value={selection.subUnit} onChange={onSelectionChange} disabled={!selection.unit || subUnitKeys.length === 0}>
              <option value="">소단원 선택 (선택 사항)</option>
              {subUnitKeys.map(subUnit => <option key={subUnit} value={subUnit}>{subUnit}</option>)}
            </Form.Select>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CurriculumSelector;
