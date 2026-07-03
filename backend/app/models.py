from pydantic import BaseModel, Field, computed_field


class FootingRow(BaseModel):
    """One row from a footing schedule table."""

    mark: str = Field(description="Footing label, e.g. F1, F-2")
    length_ft: float = Field(description="Length in feet")
    width_ft: float = Field(description="Width in feet")
    depth_ft: float = Field(description="Depth/thickness in feet")
    rebar: str | None = Field(default=None, description="Rebar spec if listed")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def volume_cy(self) -> float:
        """Cubic yards = L × W × D / 27 (standard US concrete unit)."""
        return round((self.length_ft * self.width_ft * self.depth_ft) / 27, 2)


class FootingSchedule(BaseModel):
    """Structured output from a footing schedule sheet."""

    sheet_title: str | None = None
    scale: str | None = None
    footings: list[FootingRow] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    confidence: str = Field(default="medium", description="low | medium | high")
    model_used: str | None = Field(default=None, description="Claude model that produced this result")
    extraction_tier: str | None = Field(default=None, description="fast | strong")
