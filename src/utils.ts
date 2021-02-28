export function renderPanel(typeConversions: Map<string, string>): string {
  const m = typeConversions;
  // eslint sure makes this next bit kind of weird looking
  const innerHTML = `
    <table>
        <thead><tr><th class="typeCol">Type</th><th class="typeValue">Value (unsigned)</th><th>(signed)</th></tr></thead>
        <tr><td>i8</td>     <td>${m.get('u8')}</td><td>${m.get('i8')}</td></tr>
        <tr><td>i16le</td>  <td>${m.get('u16le')}</td><td>${m.get(
    'i16le'
  )}</td></tr>
        <tr><td>i32le</td>  <td>${m.get('u32le')}</td><td>${m.get(
    'i32le'
  )}</td></tr>
        <tr><td>i64le</td>  <td>${m.get('u64le')}</td><td>${m.get(
    'i64le'
  )}</td></tr>
        <tr><td>i16be</td>  <td>${m.get('u16be')}</td><td>${m.get(
    'i16be'
  )}</td></tr>
        <tr><td>i32be</td>  <td>${m.get('u32be')}</td><td>${m.get(
    'i32be'
  )}</td></tr>
        <tr><td>i64be</td>  <td>${m.get('u64be')}</td><td>${m.get(
    'i64be'
  )}</td></tr>
        <tr><td>float</td>  <td colspan="2">${m.get('float')}</td></tr>
        <tr><td>double</td> <td colspan="2">${m.get('double')}</td></tr>
        <tr><td>unixts</td> <td colspan="2">${m.get('unixts')}</td></tr>
        <tr><td>ascii</td>  <td colspan="2"><div class="str">${m.get(
          'ascii'
        )}</div></td></tr>
        <tr><td>utf8</td>   <td colspan="2"><div class="str">${m.get(
          'utf8'
        )}</div></td></tr>
        <tr><td>utf16le</td><td colspan="2"><div class="str">${m.get(
          'utf16le'
        )}</div></td></tr>
        <tr><td>utf16be</td><td colspan="2"><div class="str">${m.get(
          'utf16be'
        )}</div></td></tr>
    </table>
`;
  return innerHTML;
}
