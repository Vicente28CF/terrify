from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("terrenos", "0007_terreno_positive_constraints"),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            reverse_sql="DROP EXTENSION IF EXISTS pg_trgm;",
        ),
        migrations.AddField(
            model_name="terreno",
            name="acepta_financiamiento",
            field=models.BooleanField(default=False),
        ),
        migrations.AddIndex(
            model_name="terreno",
            index=models.Index(
                fields=["terrain_type"],
                name="terreno_terrain_type_idx",
            ),
        ),
    ]
