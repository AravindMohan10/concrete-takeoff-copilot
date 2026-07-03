from app.extractor import schedule_to_csv
from app.models import FootingRow, FootingSchedule


def test_footing_row_volume_cy():
    row = FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1)
    assert row.volume_cy == 0.59


def test_footing_row_volume_cy_larger_footing():
    row = FootingRow(mark="F2", length_ft=5, width_ft=5, depth_ft=1.5)
    assert row.volume_cy == 1.39


def test_schedule_to_csv_includes_total():
    schedule = FootingSchedule(
        footings=[
            FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1),
            FootingRow(mark="F2", length_ft=5, width_ft=5, depth_ft=1.5, rebar="#5 @ 10"),
        ],
        confidence="high",
    )
    csv = schedule_to_csv(schedule)
    assert csv.startswith("mark,length_ft,width_ft,depth_ft,volume_cy,rebar\n")
    assert "F1," in csv and "0.59," in csv
    assert "TOTAL,,,,1.98," in csv
