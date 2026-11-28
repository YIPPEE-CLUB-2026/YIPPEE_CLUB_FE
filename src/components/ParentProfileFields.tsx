import type { ParentRelation, ParentAgeGroup } from '../services/profile';

export function ParentProfileFields({ relation, ageGroup, onRelation, onAgeGroup, disabled }: {
  relation: ParentRelation | ''; ageGroup: ParentAgeGroup | '';
  onRelation: (value: ParentRelation) => void; onAgeGroup: (value: ParentAgeGroup | '') => void; disabled?: boolean;
}) {
  return <>
    <label className="wire-field"><span>아이와의 관계 <span className="required">*</span></span>
      <select required value={relation} disabled={disabled} onChange={e => onRelation(e.target.value as ParentRelation)}>
        <option value="" disabled>관계를 선택해 주세요</option>
        <option value="mother">어머니</option><option value="father">아버지</option><option value="grandparent">조부모</option><option value="other">기타 보호자</option>
      </select>
    </label>
    <label className="wire-field"><span>부모님 연령대 (선택)</span>
      <select value={ageGroup} disabled={disabled} onChange={e => onAgeGroup(e.target.value as ParentAgeGroup | '')}>
        <option value="">선택하지 않음</option><option value="20s">20대</option><option value="30s">30대</option><option value="40s">40대</option><option value="50s_plus">50대 이상</option>
      </select>
    </label>
  </>;
}
