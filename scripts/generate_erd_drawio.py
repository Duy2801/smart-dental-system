from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "so-do-co-so-du-lieu-full.txt"
OUTPUTS = (
    ROOT / "docs" / "so-do-co-so-du-lieu-full-drawio.txt",
    ROOT / "docs" / "so-do-co-so-du-lieu-full.drawio",
)


@dataclass(frozen=True)
class Entity:
    name: str
    color: str
    fields: tuple[tuple[str, str, bool], ...]


@dataclass(frozen=True)
class Relation:
    source_table: str
    source_field: str
    connector: str
    target_table: str
    target_field: str


PALETTE = {
    "purple": ("#f3e8ff", "#9333ea", "#581c87"),
    "green": ("#dcfce7", "#16a34a", "#14532d"),
    "blue": ("#dbeafe", "#2563eb", "#1e3a8a"),
    "orange": ("#ffedd5", "#ea580c", "#7c2d12"),
    "red": ("#fee2e2", "#dc2626", "#7f1d1d"),
    "yellow": ("#fef9c3", "#ca8a04", "#713f12"),
}


MODULES = (
    (
        "auth",
        "TÀI KHOẢN VÀ PHÂN QUYỀN",
        "purple",
        ("clinic_config", "users", "roles", "permissions", "user_roles", "role_permissions"),
        2,
    ),
    (
        "catalog",
        "DỊCH VỤ VÀ KHUYẾN MÃI",
        "green",
        (
            "services",
            "specializations",
            "treatment_methods",
            "service_media",
            "service_procedure_steps",
            "service_faqs",
            "promotions",
            "banners",
        ),
        2,
    ),
    (
        "patient",
        "BỆNH NHÂN VÀ LỊCH HẸN",
        "blue",
        ("patients", "patient_accounts", "appointments"),
        1,
    ),
    (
        "doctor",
        "BÁC SĨ VÀ LỊCH LÀM VIỆC",
        "orange",
        (
            "doctors",
            "doctor_specializations",
            "doctor_educations",
            "doctor_certificates",
            "doctor_media",
            "doctor_availability",
        ),
        2,
    ),
    (
        "clinical",
        "KHÁM VÀ ĐIỀU TRỊ",
        "red",
        (
            "medical_records",
            "treatment_plans",
            "treatment_plan_steps",
            "clinical_cases",
            "prescriptions",
            "prescription_items",
        ),
        2,
    ),
    (
        "finance",
        "TÀI CHÍNH VÀ THANH TOÁN",
        "yellow",
        ("invoices", "payments", "consultation_packages"),
        1,
    ),
    (
        "interaction",
        "TƯƠNG TÁC VÀ THÔNG BÁO",
        "purple",
        ("reviews", "chatbot_conversations", "video_consultations", "notifications"),
        2,
    ),
)


def parse_source(text: str) -> tuple[dict[str, Entity], list[Relation]]:
    entities: dict[str, Entity] = {}
    entity_pattern = re.compile(
        r"^(\w+)\s+\[color:\s*(\w+)\]\s*\{(.*?)^\}", re.MULTILINE | re.DOTALL
    )
    for match in entity_pattern.finditer(text):
        name, color, body = match.groups()
        fields: list[tuple[str, str, bool]] = []
        for raw_line in body.splitlines():
            parts = raw_line.strip().split()
            if len(parts) < 2:
                continue
            fields.append((parts[0], parts[1], "pk" in parts[2:]))
        entities[name] = Entity(name, color, tuple(fields))

    relation_pattern = re.compile(
        r"^(\w+)\.(\w+)\s+([>-])\s+(\w+)\.(\w+)$", re.MULTILINE
    )
    relations = [Relation(*match.groups()) for match in relation_pattern.finditer(text)]
    return entities, relations


def table_height(entity: Entity) -> int:
    return 42 + len(entity.fields) * 17 + 14


def add_geometry(cell: ET.Element, **attrs: object) -> ET.Element:
    attrs["as"] = "geometry"
    return ET.SubElement(cell, "mxGeometry", {key: str(value) for key, value in attrs.items()})


def table_value(entity: Entity) -> str:
    field_lines = []
    for field_name, field_type, is_pk in entity.fields:
        suffix = " [PK]" if is_pk else ""
        field_lines.append(
            f'<div><span style="font-family:monospace">{html.escape(field_name)}</span>'
            f' : {html.escape(field_type)}{suffix}</div>'
        )
    return (
        f'<div style="font-size:13px;font-weight:bold;margin-bottom:6px">'
        f"{html.escape(entity.name)}</div>"
        + "".join(field_lines)
    )


def build_diagram(entities: dict[str, Entity], relations: list[Relation]) -> ET.Element:
    model = ET.Element(
        "mxGraphModel",
        {
            "dx": "1600",
            "dy": "900",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": "3200",
            "pageHeight": "2800",
            "math": "0",
            "shadow": "0",
        },
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    title = ET.SubElement(
        root,
        "mxCell",
        {
            "id": "diagram-title",
            "value": "SƠ ĐỒ CƠ SỞ DỮ LIỆU SMART DENTAL SYSTEM",
            "style": (
                "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;"
                "fontFamily=Arial;fontSize=24;fontStyle=1;fontColor=#16324F;"
            ),
            "vertex": "1",
            "parent": "1",
        },
    )
    add_geometry(title, x=700, y=20, width=1800, height=40)

    module_positions = {
        "auth": (40, 90),
        "catalog": (800, 90),
        "patient": (1580, 90),
        "doctor": (2030, 90),
        "clinical": (760, 1450),
        "finance": (1580, 1450),
        "interaction": (2030, 1450),
    }
    table_width = 330
    column_gap = 28
    row_gap = 24
    global_boxes: dict[str, tuple[float, float, float, float]] = {}

    for module_id, label, color, table_names, column_count in MODULES:
        x, y = module_positions[module_id]
        columns: list[list[tuple[str, int, int]]] = [[] for _ in range(column_count)]
        column_heights = [0 for _ in range(column_count)]
        for table_name in table_names:
            height = table_height(entities[table_name])
            column_index = min(range(column_count), key=column_heights.__getitem__)
            table_y = column_heights[column_index]
            columns[column_index].append((table_name, table_y, height))
            column_heights[column_index] += height + row_gap

        for column_index, column in enumerate(columns):
            table_x = x + column_index * (table_width + column_gap)
            for table_name, relative_y, height in column:
                entity = entities[table_name]
                table_fill, table_stroke, table_text = PALETTE[entity.color]
                cell = ET.SubElement(
                    root,
                    "mxCell",
                    {
                        "id": f"table-{table_name}",
                        "value": table_value(entity),
                        "style": (
                            "rounded=1;arcSize=5;whiteSpace=wrap;html=1;align=left;verticalAlign=top;"
                            f"spacing=9;fillColor={table_fill};strokeColor={table_stroke};strokeWidth=1.5;"
                            f"fontFamily=Arial;fontSize=10;fontColor={table_text};overflow=hidden;"
                        ),
                        "vertex": "1",
                        "parent": "1",
                    },
                )
                table_y = y + relative_y
                add_geometry(cell, x=table_x, y=table_y, width=table_width, height=height)
                global_boxes[table_name] = (table_x, table_y, table_width, height)

    relation_counts: dict[tuple[str, str], int] = {}
    for relation_index, relation in enumerate(relations, start=1):
        source_box = global_boxes[relation.source_table]
        target_box = global_boxes[relation.target_table]
        source_center = (source_box[0] + source_box[2] / 2, source_box[1] + source_box[3] / 2)
        target_center = (target_box[0] + target_box[2] / 2, target_box[1] + target_box[3] / 2)
        dx = target_center[0] - source_center[0]
        dy = target_center[1] - source_center[1]

        if abs(dx) >= abs(dy):
            exit_x, entry_x = ((1, 0) if dx >= 0 else (0, 1))
            exit_y = entry_y = 0.5
        else:
            exit_y, entry_y = ((1, 0) if dy >= 0 else (0, 1))
            exit_x = entry_x = 0.5

        pair = tuple(sorted((relation.source_table, relation.target_table)))
        pair_offset = relation_counts.get(pair, 0)
        relation_counts[pair] = pair_offset + 1
        if exit_y == 0.5:
            exit_y = min(0.82, 0.32 + pair_offset * 0.16)
            entry_y = min(0.82, 0.32 + pair_offset * 0.16)
        else:
            exit_x = min(0.82, 0.32 + pair_offset * 0.16)
            entry_x = min(0.82, 0.32 + pair_offset * 0.16)

        _, stroke, _ = PALETTE[entities[relation.source_table].color]
        start_arrow = "ERone" if relation.connector == "-" else "ERmany"
        edge = ET.SubElement(
            root,
            "mxCell",
            {
                "id": f"relation-{relation_index}",
                "value": relation.source_field,
                "style": (
                    "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
                    f"strokeColor={stroke};strokeWidth=1.4;startArrow={start_arrow};startFill=0;"
                    "endArrow=ERone;endFill=0;startSize=12;endSize=12;"
                    f"exitX={exit_x};exitY={exit_y};entryX={entry_x};entryY={entry_y};"
                    "fontFamily=Arial;fontSize=9;labelBackgroundColor=#ffffff;"
                ),
                "edge": "1",
                "parent": "1",
                "source": f"table-{relation.source_table}",
                "target": f"table-{relation.target_table}",
            },
        )
        add_geometry(edge, relative=1)

    note = ET.SubElement(
        root,
        "mxCell",
        {
            "id": "diagram-note",
            "value": "Đường nối thể hiện quan hệ khóa ngoại. Nhãn trên đường là tên cột khóa ngoại.",
            "style": (
                "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;"
                "fontFamily=Arial;fontSize=11;fontStyle=2;fontColor=#64748b;"
            ),
            "vertex": "1",
            "parent": "1",
        },
    )
    add_geometry(note, x=900, y=2650, width=1400, height=30)
    return model


def main() -> None:
    entities, relations = parse_source(SOURCE.read_text(encoding="utf-8"))
    expected_tables = {table for _, _, _, tables, _ in MODULES for table in tables}
    if set(entities) != expected_tables:
        missing = sorted(set(entities) - expected_tables)
        extra = sorted(expected_tables - set(entities))
        raise ValueError(f"Module mapping mismatch. Missing={missing}, extra={extra}")
    model = build_diagram(entities, relations)
    ET.indent(model, space="  ")
    diagram_xml = ET.tostring(model, encoding="unicode")
    for output in OUTPUTS:
        output.write_text(diagram_xml, encoding="utf-8")
    print(
        f"Generated {len(OUTPUTS)} files with "
        f"{len(entities)} tables and {len(relations)} relations"
    )


if __name__ == "__main__":
    main()
